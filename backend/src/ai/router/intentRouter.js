export class IntentRouter {
  /**
   * Classify user intent from message, chat history, and conversation state
   */
  classifyIntent(message, state = {}, userRole = "user") {
    if (!message || typeof message !== "string") {
      return "SUPPORT_POLICY";
    }

    const lower = message.toLowerCase().trim();

    // 1. Owner Analytics Intent (Owner / Admin queries)
    if (
      userRole === "owner" ||
      userRole === "admin" ||
      /\b(occupancy|revenue|yield|performance|my bookings|cancellation rate|why are bookings (dropping|decreasing)|which room performs best)\b/.test(lower)
    ) {
      if (
        /\b(why|how|analyze|analytics|revenue|occupancy|performance|rate|stats|insights)\b/.test(lower)
      ) {
        return "OWNER_ANALYTICS";
      }
    }

    // 2. Travel Planner Intent (Multi-day trips, itineraries, tourist plans)
    if (
      /\b(\d+[- ]?day(s)?|trip|itinerary|visiting|vacation plan|sightseeing plan|guide for)\b/.test(lower) &&
      !/\b(cancel|refund|policy)\b/.test(lower)
    ) {
      return "TRAVEL_PLANNER";
    }

    // 3. Hotel Comparison Intent (Side-by-side comparison)
    if (
      /\b(compare|vs|versus|difference between|which is better)\b/.test(lower) &&
      (/\b(hotel|resort|stay|taj|hyatt|marriott|radisson|option)\b/.test(lower) || lower.includes(" and "))
    ) {
      return "HOTEL_COMPARISON";
    }

    // 4. Booking Workflow Intent (Explicit confirmation or step progression in active booking flow)
    const isStepProgressing =
      state.currentStep &&
      ["HOTEL_SELECTED", "ROOM_SELECTED", "DATES_GUESTS_COLLECTED", "PAYMENT_SELECTED", "AWAITING_CONFIRMATION"].includes(
        state.currentStep
      );

    const isBookingConfirmation =
      /^(yes|confirm|proceed|book it|book now|go ahead|sure|do it|ok|okay|yep|yeah)$/i.test(lower) ||
      /\b(confirm booking|proceed to pay|reserve now)\b/.test(lower);

    const isNumericSelection = /^\s*([1-9]|10)\s*$/.test(lower);

    const isDirectBookingAction =
      /\b(book (this|that|the|a)?|reserve (this|that|the|a)?|create booking)\b/.test(lower);

    if (isBookingConfirmation || (isStepProgressing && isNumericSelection) || isDirectBookingAction) {
      return "BOOKING_WORKFLOW";
    }

    // 5. Policy & Support (RAG queries)
    const isPolicyQuery =
      /\b(cancellation|cancel policy|refund|can i cancel|policy|rules|check-?in time|check-?out time|distance|how far|swimming pool|pool timings|breakfast included|pet friendly|wifi password)\b/.test(
        lower
      ) ||
      (lower.includes("?") && /\b(pool|gym|parking|cancel|refund|policy|food)\b/.test(lower));

    if (isPolicyQuery) {
      return "SUPPORT_POLICY";
    }

    // 6. Hotel Discovery / Concierge Search
    const isSearchQuery =
      /\b(find|search|show|recommend|suggest|list|hotels? in|stays? in|resorts? in|near|budget hotels?)\b/.test(
        lower
      ) ||
      /^(hi|hello|hey|good morning|help)\b/.test(lower);

    if (isSearchQuery) {
      return "HOTEL_DISCOVERY";
    }

    // Default: If in active booking state, treat as booking workflow, else support/concierge
    if (isStepProgressing) {
      return "BOOKING_WORKFLOW";
    }

    return "HOTEL_DISCOVERY";
  }
}

export const intentRouter = new IntentRouter();
