import { conversationStateService } from "../state/conversationState.service.js";
import { entityResolver } from "./entityResolver.js";
import { bookingInterceptor } from "./bookingInterceptor.js";
import { Hotel } from "../../models/hotel.models.js";
import { Room } from "../../models/room.models.js";

export class WorkflowEngine {
  /**
   * Process a user message through the deterministic workflow engine
   */
  async process(userId, message, state) {
    const sessionId = state.sessionId;
    const currentStep = state.currentStep || "IDLE";
    const { resolvedEntities } = entityResolver.resolve(message, state);

    // 1. Check direct confirmation guard via interceptor first
    const intercepted = await bookingInterceptor.intercept(userId, message, state);
    if (intercepted) {
      return intercepted;
    }

    // 2. State-specific workflow handler
    switch (currentStep) {
      case "SEARCH_RESULTS":
        return await this.handleHotelSelectionStep(userId, message, state, resolvedEntities);

      case "HOTEL_SELECTED":
        return await this.handleRoomSelectionStep(userId, message, state, resolvedEntities);

      case "ROOM_SELECTED":
        return await this.handleDateAndGuestsStep(userId, message, state, resolvedEntities);

      case "DATES_GUESTS_COLLECTED":
        return await this.handlePaymentSelectionStep(userId, message, state, resolvedEntities);

      case "PAYMENT_SELECTED":
      case "AWAITING_CONFIRMATION":
        return await this.handleConfirmationStep(userId, message, state, resolvedEntities);

      default:
        // For IDLE or general chat, let Agent/RAG handle
        return null;
    }
  }

  /**
   * Step: User picks a hotel from search results (e.g., "1", "Somnath Beach Resort", "second option")
   */
  async handleHotelSelectionStep(userId, message, state, resolvedEntities) {
    const hotelId = resolvedEntities.hotelId;
    if (!hotelId) return null; // Pass through to agent if not a selection

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return null;

    // Update state to HOTEL_SELECTED
    await conversationStateService.setSelectedHotel(state.sessionId, hotel, userId);

    // Fetch available rooms
    const rooms = await Room.find({ hotelId, isAvailable: true }).limit(5);
    if (!rooms.length) {
      return {
        handled: true,
        response: `😔 **${hotel.name}** currently has no available rooms. Would you like to check another hotel?`,
      };
    }

    const roomList = rooms
      .map(
        (r, i) =>
          `**${i + 1}. ${r.title}** (${r.roomType})\n` +
          `   💰 ₹${r.pricePerDay.toLocaleString("en-IN")}/night | 👥 Max ${r.maxGuests} guests | 🛏️ ${r.totalRooms} left`
      )
      .join("\n\n");

    return {
      handled: true,
      response:
        `✅ You selected **${hotel.name}** in ${hotel.city}.\n\n` +
        `📋 **Available Room Options:**\n\n${roomList}\n\n` +
        `👉 *Reply with the room number (e.g. 1 or 2) to continue.*`,
    };
  }

  /**
   * Step: User picks a room (e.g. "1", "Deluxe", "2")
   */
  async handleRoomSelectionStep(userId, message, state, resolvedEntities) {
    if (!state.selectedHotel?.hotelId) return null;

    const rooms = await Room.find({
      hotelId: state.selectedHotel.hotelId,
      isAvailable: true,
    }).limit(5);

    let selectedRoom = null;
    const ordinalIndex = entityResolver.extractOrdinalIndex(message);

    if (ordinalIndex !== null && rooms[ordinalIndex]) {
      selectedRoom = rooms[ordinalIndex];
    } else {
      const lower = message.toLowerCase();
      selectedRoom = rooms.find(
        (r) =>
          lower.includes(r.roomType.toLowerCase()) ||
          lower.includes(r.title.toLowerCase())
      );
    }

    if (!selectedRoom) return null; // Let agent handle if unclear

    // Update state to ROOM_SELECTED
    await conversationStateService.setSelectedRoom(state.sessionId, selectedRoom, userId);

    return {
      handled: true,
      response:
        `🛏️ You selected **${selectedRoom.title}** (₹${selectedRoom.pricePerDay.toLocaleString("en-IN")}/night).\n\n` +
        `📅 **When are you visiting?**\n` +
        `Please provide your check-in, check-out dates and guest count.\n\n` +
        `*Example: 2026-10-05 to 2026-10-08, 2 guests*`,
    };
  }

  /**
   * Step: User provides dates & guest count
   */
  async handleDateAndGuestsStep(userId, message, state, resolvedEntities) {
    if (!state.selectedRoom?.roomId) return null;

    const dateMatches = message.match(/\b(\d{4}-\d{2}-\d{2})\b/g);
    if (!dateMatches || dateMatches.length < 2) return null;

    const checkIn = dateMatches[0];
    const checkOut = dateMatches[1];
    const guests = resolvedEntities.guests || 2;

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const totalPrice = (state.selectedRoom.price || 2000) * nights;

    await conversationStateService.setBookingDetails(
      state.sessionId,
      { checkIn, checkOut, guests, nights, totalPrice },
      userId
    );

    return {
      handled: true,
      response:
        `📅 **Stay Details:**\n` +
        `• Check-in: ${checkIn}\n` +
        `• Check-out: ${checkOut}\n` +
        `• Duration: ${nights} night${nights > 1 ? "s" : ""}\n` +
        `• Guests: ${guests}\n` +
        `• Total Amount: ₹${totalPrice.toLocaleString("en-IN")}\n\n` +
        `💳 **How would you like to pay?**\n` +
        `1. **Stripe** (Credit / Debit Card)\n` +
        `2. **Razorpay** (UPI, Netbanking, Cards)\n` +
        `3. **Pay at Hotel** (Cash on Delivery / COD)\n\n` +
        `👉 *Reply with 1, 2, 3 or the payment name.*`,
    };
  }

  /**
   * Step: User selects payment method
   */
  async handlePaymentSelectionStep(userId, message, state, resolvedEntities) {
    const paymentMethod = resolvedEntities.paymentMethod;
    if (!paymentMethod) return null;

    await conversationStateService.setPaymentMethod(state.sessionId, paymentMethod, userId);

    const freshState = await conversationStateService.getState(state.sessionId, userId);
    const p = freshState.pendingBooking || {};

    const summaryText =
      `📋 **Booking Summary:**\n` +
      `🏨 **Hotel:** ${freshState.selectedHotel?.hotelName || "Selected Hotel"}\n` +
      `🛏️ **Room:** ${freshState.selectedRoom?.title || freshState.selectedRoom?.roomType}\n` +
      `📅 **Dates:** ${freshState.bookingDetails?.checkIn} to ${freshState.bookingDetails?.checkOut} (${freshState.bookingDetails?.nights} nights)\n` +
      `👥 **Guests:** ${freshState.bookingDetails?.guests}\n` +
      `💰 **Total:** ₹${(p.totalPrice || 0).toLocaleString("en-IN")}\n` +
      `💳 **Payment:** ${paymentMethod.toUpperCase()}\n\n` +
      `Shall I confirm this booking? Reply **Yes** to confirm or **No** to cancel.`;

    return {
      handled: true,
      response: summaryText,
    };
  }

  /**
   * Step: Confirmation
   */
  async handleConfirmationStep(userId, message, state, resolvedEntities) {
    return await bookingInterceptor.intercept(userId, message, state);
  }
}

export const workflowEngine = new WorkflowEngine();
