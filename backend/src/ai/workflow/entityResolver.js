/**
 * Entity & Reference Resolution Layer
 * Resolves conversational references like:
 * - "this hotel", "that hotel", "book it"
 * - "first option", "option 2", "1", "2", "the second one"
 * - "previous hotel", "the resort in Somnath"
 * against the structured conversation state.
 */

export class EntityResolver {
  /**
   * Main resolution method: takes raw user message + current state
   * and extracts resolved hotelId, roomId, paymentMethod, dates, guests, or intent.
   */
  resolve(message, state = {}) {
    if (!message || typeof message !== "string") {
      return { message, resolvedEntities: {} };
    }

    const lower = message.trim().toLowerCase();
    const resolvedEntities = {};

    // 1. Ordinal / Index Reference Resolution (e.g., "1", "2", "first option", "second hotel", "the 3rd one")
    const ordinalMatch = this.extractOrdinalIndex(lower);
    if (
      ordinalMatch !== null &&
      state.recentlyRecommendedHotels &&
      state.recentlyRecommendedHotels.length > 0
    ) {
      const targetHotel = state.recentlyRecommendedHotels[ordinalMatch];
      if (targetHotel) {
        resolvedEntities.referencedHotel = targetHotel;
        resolvedEntities.hotelId = targetHotel.hotelId;
        resolvedEntities.hotelName = targetHotel.hotelName;
      }
    }

    // 2. Relative Pronoun Resolution ("this hotel", "that resort", "book it", "this one")
    const isRelativeReference =
      /\b(this|that|it|the same|current|previous)\s*(hotel|resort|property|room|one|stay)?\b/.test(
        lower
      ) ||
      lower === "book this" ||
      lower === "book that" ||
      lower === "book it";

    if (isRelativeReference) {
      if (state.selectedHotel) {
        resolvedEntities.referencedHotel = state.selectedHotel;
        resolvedEntities.hotelId = state.selectedHotel.hotelId;
        resolvedEntities.hotelName = state.selectedHotel.hotelName;
      } else if (
        state.recentlyRecommendedHotels &&
        state.recentlyRecommendedHotels.length > 0
      ) {
        // Default to the top recommended hotel
        const topHotel = state.recentlyRecommendedHotels[0];
        resolvedEntities.referencedHotel = topHotel;
        resolvedEntities.hotelId = topHotel.hotelId;
        resolvedEntities.hotelName = topHotel.hotelName;
      }
    }

    // 3. Name-based fuzzy search against recently recommended hotels
    if (!resolvedEntities.hotelId && state.recentlyRecommendedHotels?.length > 0) {
      for (const rec of state.recentlyRecommendedHotels) {
        const hotelNameLower = rec.hotelName.toLowerCase();
        // Match significant words in the hotel name
        const nameTokens = hotelNameLower
          .split(/\s+/)
          .filter((t) => t.length > 3 && !["hotel", "resort", "inn", "stay", "palace"].includes(t));

        if (
          lower.includes(hotelNameLower) ||
          nameTokens.some((token) => lower.includes(token))
        ) {
          resolvedEntities.referencedHotel = rec;
          resolvedEntities.hotelId = rec.hotelId;
          resolvedEntities.hotelName = rec.hotelName;
          break;
        }
      }
    }

    // 4. Payment Method Extraction
    if (/\b(stripe|card|credit card|debit card)\b/.test(lower) || lower === "1") {
      if (state.currentStep === "PAYMENT_SELECTED" || state.selectedRoom) {
        resolvedEntities.paymentMethod = "stripe";
      }
    }
    if (/\b(razorpay|upi|gpay|phonepe|netbanking)\b/.test(lower) || lower === "2") {
      if (state.currentStep === "PAYMENT_SELECTED" || state.selectedRoom) {
        resolvedEntities.paymentMethod = "razorpay";
      }
    }
    if (
      /\b(cod|cash|pay at hotel|cash on delivery|pay later)\b/.test(lower) ||
      lower === "3"
    ) {
      if (state.currentStep === "PAYMENT_SELECTED" || state.selectedRoom) {
        resolvedEntities.paymentMethod = "cod";
      }
    }

    // 5. Positive Confirmation Detection
    resolvedEntities.isConfirmation = this.isAffirmativeConfirmation(lower);
    resolvedEntities.isCancellation = this.isNegativeCancellation(lower);

    // 6. Guest count extraction
    const guestMatch = lower.match(/\b(\d+)\s*(guests?|people|persons?|adults?|pax)\b/);
    if (guestMatch) {
      resolvedEntities.guests = parseInt(guestMatch[1], 10);
    } else if (
      /^\d+$/.test(lower) &&
      state.currentStep === "ROOM_SELECTED" &&
      state.bookingDetails?.checkIn
    ) {
      resolvedEntities.guests = parseInt(lower, 10);
    }

    return {
      originalMessage: message,
      resolvedEntities,
    };
  }

  /**
   * Convert words or digits into 0-based array index
   */
  extractOrdinalIndex(text) {
    // Exact single number
    if (/^\s*([1-9]|10)\s*$/.test(text)) {
      return parseInt(text.trim(), 10) - 1;
    }

    // Phrases like "hotel 2", "option 1", "number 3", "room 2"
    const optionMatch = text.match(
      /\b(?:option|hotel|room|number|choice|#)\s*([1-9]|10)\b/
    );
    if (optionMatch) {
      return parseInt(optionMatch[1], 10) - 1;
    }

    // Word ordinals
    if (/\b(first|1st|top one|number one)\b/.test(text)) return 0;
    if (/\b(second|2nd|number two)\b/.test(text)) return 1;
    if (/\b(third|3rd|number three)\b/.test(text)) return 2;
    if (/\b(fourth|4th|number four)\b/.test(text)) return 3;
    if (/\b(fifth|5th|number five)\b/.test(text)) return 4;

    return null;
  }

  /**
   * Test for explicit affirmative confirmation
   */
  isAffirmativeConfirmation(text) {
    const clean = text.trim().toLowerCase().replace(/[^\w\s]/g, "");
    const affirmatives = [
      "yes",
      "yep",
      "yeah",
      "confirm",
      "confirmed",
      "proceed",
      "book it",
      "book now",
      "go ahead",
      "sure",
      "do it",
      "ok",
      "okay",
      "alright",
      "please book",
      "yes please",
      "confirm booking",
    ];

    return (
      affirmatives.includes(clean) ||
      affirmatives.some((aff) => clean.startsWith(aff + " ") || clean.endsWith(" " + aff))
    );
  }

  /**
   * Test for negative cancellation
   */
  isNegativeCancellation(text) {
    const clean = text.trim().toLowerCase().replace(/[^\w\s]/g, "");
    const negatives = ["no", "cancel", "stop", "abort", "dont book", "no thanks", "nevermind", "restart", "start over"];
    return negatives.includes(clean) || negatives.some((neg) => clean.startsWith(neg));
  }
}

export const entityResolver = new EntityResolver();
