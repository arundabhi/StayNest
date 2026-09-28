import { jest } from "@jest/globals";
import { ConversationStateService } from "../src/ai/state/conversationState.service.js";

describe("Conversation State Service Unit Tests", () => {
  let mockRepo;
  let stateService;
  let inMemoryDb;

  beforeEach(() => {
    inMemoryDb = new Map();
    mockRepo = {
      findBySessionId: jest.fn(async (sessionId) => inMemoryDb.get(sessionId) || null),
      upsertState: jest.fn(async (sessionId, stateData) => {
        inMemoryDb.set(sessionId, stateData);
        return stateData;
      }),
      resetState: jest.fn(async (sessionId) => {
        const reset = { sessionId, currentStep: "IDLE", recentlyRecommendedHotels: [] };
        inMemoryDb.set(sessionId, reset);
        return reset;
      }),
    };
    stateService = new ConversationStateService(mockRepo);
  });

  test("should return default state for new session", async () => {
    const state = await stateService.getState("sess_123", "user_abc");
    expect(state).toBeDefined();
    expect(state.sessionId).toBe("sess_123");
    expect(state.currentStep).toBe("IDLE");
  });

  test("should update selected hotel and transition step to HOTEL_SELECTED", async () => {
    const hotel = {
      _id: "60d5ecb8bcf86cd799439011",
      name: "Somnath Beach Resort",
      city: "Somnath",
      basePrice: 3500,
    };

    const updated = await stateService.setSelectedHotel("sess_123", hotel, "user_abc");
    expect(updated.currentStep).toBe("HOTEL_SELECTED");
    expect(updated.selectedHotel.hotelId).toBe("60d5ecb8bcf86cd799439011");
    expect(updated.selectedHotel.hotelName).toBe("Somnath Beach Resort");
  });

  test("should set booking details and update pending booking state", async () => {
    await stateService.setSelectedHotel("sess_123", {
      _id: "60d5ecb8bcf86cd799439011",
      name: "Somnath Beach Resort",
    });

    await stateService.setSelectedRoom("sess_123", {
      _id: "70d5ecb8bcf86cd799439022",
      roomType: "deluxe",
      title: "Deluxe Ocean View",
      pricePerDay: 4000,
      maxGuests: 3,
    });

    const bookingDetails = {
      checkIn: "2026-10-10",
      checkOut: "2026-10-13",
      guests: 2,
      nights: 3,
      totalPrice: 12000,
    };

    await stateService.setBookingDetails("sess_123", bookingDetails);
    const withPayment = await stateService.setPaymentMethod("sess_123", "stripe");

    expect(withPayment.currentStep).toBe("AWAITING_CONFIRMATION");
    expect(withPayment.paymentMethod).toBe("stripe");
    expect(withPayment.pendingBooking.status).toBe("awaiting_confirmation");
    expect(withPayment.pendingBooking.totalPrice).toBe(12000);
  });

  test("should reset state cleanly", async () => {
    await stateService.resetState("sess_123");
    const state = await stateService.getState("sess_123");
    expect(state.currentStep).toBe("IDLE");
    expect(state.selectedHotel).toBeUndefined();
  });
});
