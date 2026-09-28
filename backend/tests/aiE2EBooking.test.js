import { jest } from "@jest/globals";
import { EntityResolver } from "../src/ai/workflow/entityResolver.js";
import { ConversationStateService } from "../src/ai/state/conversationState.service.js";

describe("E2E Conversational Booking Flow Simulation", () => {
  let stateService;
  let resolver;
  let inMemoryDb;
  const sessionId = "session_e2e_test_999";
  const userId = "user_test_999";

  beforeEach(() => {
    inMemoryDb = new Map();
    const mockRepo = {
      findBySessionId: jest.fn(async (sId) => inMemoryDb.get(sId) || null),
      upsertState: jest.fn(async (sId, stateData) => {
        inMemoryDb.set(sId, stateData);
        return stateData;
      }),
      resetState: jest.fn(async (sId) => {
        const reset = { sessionId: sId, currentStep: "IDLE", recentlyRecommendedHotels: [] };
        inMemoryDb.set(sId, reset);
        return reset;
      }),
    };
    stateService = new ConversationStateService(mockRepo);
    resolver = new EntityResolver();
  });

  test("should preserve structured state across all 7 turns and confirm booking on 'Yes'", async () => {
    // ── Turn 1 & 2: Search Somnath ─────────────────────────
    const recommendedHotels = [
      {
        hotelId: "60d5ecb8bcf86cd799439011",
        hotelName: "Somnath Beach Resort",
        city: "Somnath",
        basePrice: 3500,
      },
      {
        hotelId: "60d5ecb8bcf86cd799439012",
        hotelName: "Temple View Palace",
        city: "Somnath",
        basePrice: 2800,
      },
    ];

    let state = await stateService.setRecentlyRecommendedHotels(
      sessionId,
      recommendedHotels,
      "Somnath",
      userId
    );
    expect(state.currentStep).toBe("SEARCH_RESULTS");
    expect(state.recentlyRecommendedHotels.length).toBe(2);

    // ── Turn 3: User says 'Book this hotel' ─────────────────
    const turn3Resolution = resolver.resolve("Book this hotel", state);
    expect(turn3Resolution.resolvedEntities.hotelId).toBe("60d5ecb8bcf86cd799439011");

    state = await stateService.setSelectedHotel(
      sessionId,
      {
        hotelId: turn3Resolution.resolvedEntities.hotelId,
        hotelName: turn3Resolution.resolvedEntities.hotelName,
      },
      userId
    );
    expect(state.currentStep).toBe("HOTEL_SELECTED");
    expect(state.selectedHotel.hotelName).toBe("Somnath Beach Resort");

    // ── Turn 4: User selects room '2' ──────────────────────
    const rooms = [
      { roomId: "room_1", title: "Standard Room", roomType: "standard", pricePerDay: 3000 },
      { roomId: "room_2", title: "Deluxe Ocean View", roomType: "deluxe", pricePerDay: 4500 },
    ];
    const roomIndex = resolver.extractOrdinalIndex("2");
    expect(roomIndex).toBe(1);

    state = await stateService.setSelectedRoom(sessionId, rooms[roomIndex], userId);
    expect(state.currentStep).toBe("ROOM_SELECTED");
    expect(state.selectedRoom.title).toBe("Deluxe Ocean View");

    // ── Turn 5: User provides dates and guests ─────────────
    state = await stateService.setBookingDetails(
      sessionId,
      {
        checkIn: "2026-10-10",
        checkOut: "2026-10-13",
        guests: 2,
        nights: 3,
        totalPrice: 13500,
      },
      userId
    );
    expect(state.currentStep).toBe("DATES_GUESTS_COLLECTED");
    expect(state.bookingDetails.nights).toBe(3);

    // ── Turn 6: User selects 'Stripe' ──────────────────────
    const turn6Resolution = resolver.resolve("Stripe", state);
    expect(turn6Resolution.resolvedEntities.paymentMethod).toBe("stripe");

    state = await stateService.setPaymentMethod(sessionId, "stripe", userId);
    expect(state.currentStep).toBe("AWAITING_CONFIRMATION");
    expect(state.pendingBooking.status).toBe("awaiting_confirmation");
    expect(state.pendingBooking.hotelId).toBe("60d5ecb8bcf86cd799439011");
    expect(state.pendingBooking.roomId).toBe("room_2");

    // ── Turn 7: User says 'Yes' ────────────────────────────
    const turn7Resolution = resolver.resolve("Yes", state);
    expect(turn7Resolution.resolvedEntities.isConfirmation).toBe(true);

    // Verify State integrity before database commit
    expect(state.pendingBooking.hotelId).toBe("60d5ecb8bcf86cd799439011");
    expect(state.pendingBooking.roomId).toBe("room_2");
    expect(state.pendingBooking.checkIn).toBe("2026-10-10");
    expect(state.pendingBooking.checkOut).toBe("2026-10-13");
    expect(state.pendingBooking.guests).toBe(2);
    expect(state.pendingBooking.totalPrice).toBe(13500);
    expect(state.pendingBooking.paymentMethod).toBe("stripe");
  });
});
