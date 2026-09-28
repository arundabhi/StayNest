import { conversationStateRepository } from "./conversationState.repository.js";

// In-Memory L1 LRU/Map cache fallback
const memoryCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 mins

export class ConversationStateService {
  constructor(repository = conversationStateRepository) {
    this.repository = repository;
    this.redisClient = null;
    this.initRedis();
  }

  async initRedis() {
    try {
      if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        const { createClient } = await import("redis");
        const client = createClient({
          url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${process.env.REDIS_PORT || 6379}`,
        });
        client.on("error", (err) => {
          console.warn("[STATE SERVICE] Redis connection error (using memory fallback):", err.message);
        });
        await client.connect();
        this.redisClient = client;
        console.log("✅ Conversation State Service: Redis L1 Cache Active");
      }
    } catch {
      console.log("[STATE SERVICE] Running with In-Memory L1 + MongoDB L2");
    }
  }

  /**
   * Get state with Cache-Aside strategy (Redis/Memory -> MongoDB)
   */
  async getState(sessionId, userId = null) {
    if (!sessionId) return this.getDefaultState(sessionId, userId);

    // 1. Try Redis
    if (this.redisClient?.isReady) {
      try {
        const cached = await this.redisClient.get(`state:${sessionId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        console.warn("[STATE SERVICE] Redis get error:", err.message);
      }
    }

    // 2. Try In-Memory Cache
    const memEntry = memoryCache.get(sessionId);
    if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL_MS) {
      return memEntry.data;
    }

    // 3. Fallback to MongoDB (L2)
    let state = await this.repository.findBySessionId(sessionId);

    if (!state) {
      state = this.getDefaultState(sessionId, userId);
      // Persist new state
      await this.repository.upsertState(sessionId, state);
    }

    // Populate L1 cache
    this.setL1Cache(sessionId, state);

    return state;
  }

  /**
   * Save state with write-through cache to L1 and L2
   */
  async saveState(sessionId, state) {
    if (!sessionId) return null;

    // Ensure version increments
    const currentVersion = (state.version || 0) + 1;
    const updatedState = {
      ...state,
      sessionId,
      version: currentVersion,
      updatedAt: new Date(),
    };

    // Update L1 Cache
    await this.setL1Cache(sessionId, updatedState);

    // Persist to MongoDB (L2)
    return await this.repository.upsertState(sessionId, updatedState);
  }

  /**
   * Update specific state properties and persist
   */
  async updateState(sessionId, patch, userId = null) {
    const currentState = await this.getState(sessionId, userId);
    const merged = {
      ...currentState,
      ...patch,
      userId: userId || currentState.userId,
    };
    return await this.saveState(sessionId, merged);
  }

  /**
   * Set selected hotel in state
   */
  async setSelectedHotel(sessionId, hotel, userId = null) {
    return await this.updateState(
      sessionId,
      {
        selectedHotel: {
          hotelId: hotel._id?.toString() || hotel.hotelId || hotel.id,
          hotelName: hotel.name || hotel.hotelName,
          city: hotel.city,
          basePrice: hotel.basePrice,
        },
        currentStep: "HOTEL_SELECTED",
      },
      userId
    );
  }

  /**
   * Set selected room in state
   */
  async setSelectedRoom(sessionId, room, userId = null) {
    return await this.updateState(
      sessionId,
      {
        selectedRoom: {
          roomId: room._id?.toString() || room.roomId || room.id,
          roomType: room.roomType || room.type,
          title: room.title || room.roomType,
          price: room.pricePerDay || room.price,
          maxGuests: room.maxGuests,
        },
        currentStep: "ROOM_SELECTED",
      },
      userId
    );
  }

  /**
   * Set booking dates and guests
   */
  async setBookingDetails(sessionId, details, userId = null) {
    return await this.updateState(
      sessionId,
      {
        bookingDetails: {
          checkIn: details.checkIn,
          checkOut: details.checkOut,
          guests: details.guests || details.totalGuest || 1,
          nights: details.nights || 1,
          totalPrice: details.totalPrice,
        },
        currentStep: "DATES_GUESTS_COLLECTED",
      },
      userId
    );
  }

  /**
   * Set payment method and transition to awaiting confirmation
   */
  async setPaymentMethod(sessionId, paymentMethod, userId = null) {
    const normalized = paymentMethod.toLowerCase();
    const currentState = await this.getState(sessionId, userId);

    const pending = currentState.pendingBooking || {
      hotelId: currentState.selectedHotel?.hotelId,
      hotelName: currentState.selectedHotel?.hotelName,
      roomId: currentState.selectedRoom?.roomId,
      roomType: currentState.selectedRoom?.roomType,
      checkIn: currentState.bookingDetails?.checkIn,
      checkOut: currentState.bookingDetails?.checkOut,
      guests: currentState.bookingDetails?.guests || 1,
      nights: currentState.bookingDetails?.nights || 1,
      totalPrice:
        currentState.bookingDetails?.totalPrice ||
        (currentState.selectedRoom?.price || 0) *
          (currentState.bookingDetails?.nights || 1),
      paymentMethod: normalized,
      status: "awaiting_confirmation",
    };

    pending.paymentMethod = normalized;
    pending.status = "awaiting_confirmation";

    return await this.updateState(
      sessionId,
      {
        paymentMethod: normalized,
        pendingBooking: pending,
        currentStep: "AWAITING_CONFIRMATION",
      },
      userId
    );
  }

  /**
   * Record recommended hotels for entity resolution
   */
  async setRecentlyRecommendedHotels(sessionId, hotels, city = null, userId = null) {
    const formatted = hotels.map((h, i) => ({
      hotelId: (h._id || h.hotelId || h.id)?.toString(),
      hotelName: h.name || h.hotelName,
      city: h.city,
      basePrice: h.basePrice || h.price,
      rating: h.avgRating || h.rating || 0,
      rank: i + 1,
    }));

    return await this.updateState(
      sessionId,
      {
        recentlyRecommendedHotels: formatted,
        city: city || formatted[0]?.city,
        currentStep: "SEARCH_RESULTS",
      },
      userId
    );
  }

  /**
   * Reset state for session
   */
  async resetState(sessionId, userId = null) {
    memoryCache.delete(sessionId);
    if (this.redisClient?.isReady) {
      try {
        await this.redisClient.del(`state:${sessionId}`);
      } catch (err) {
        console.warn("[STATE SERVICE] Redis del error:", err.message);
      }
    }
    return await this.repository.resetState(sessionId, userId);
  }

  /**
   * Cache helper
   */
  async setL1Cache(sessionId, state) {
    memoryCache.set(sessionId, { data: state, timestamp: Date.now() });

    if (this.redisClient?.isReady) {
      try {
        await this.redisClient.setEx(
          `state:${sessionId}`,
          1800, // 30 mins
          JSON.stringify(state)
        );
      } catch (err) {
        console.warn("[STATE SERVICE] Redis set error:", err.message);
      }
    }
  }

  getDefaultState(sessionId, userId = null) {
    return {
      sessionId: sessionId || "default_session",
      userId,
      currentStep: "IDLE",
      city: undefined,
      selectedHotel: undefined,
      selectedRoom: undefined,
      bookingDetails: undefined,
      paymentMethod: undefined,
      pendingBooking: undefined,
      recentlyRecommendedHotels: [],
      metadata: {},
      version: 1,
    };
  }
}

export const conversationStateService = new ConversationStateService();
