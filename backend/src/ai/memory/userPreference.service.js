import { UserPreference } from "./userPreference.model.js";

export class UserPreferenceService {
  /**
   * Get user preferences with safe fallback
   */
  async getPreferences(userId) {
    if (!userId) return null;
    return await UserPreference.findOne({ userId }).lean();
  }

  /**
   * Asynchronously detect and update user preferences from conversational input
   */
  async extractAndUpdatePreferences(userId, message) {
    if (!userId || !message || typeof message !== "string") return null;

    const lower = message.toLowerCase();
    const updates = {};
    const addToSet = {};

    // 1. Amenity extraction
    const amenityKeywords = [
      { pattern: /\b(wifi|wi-fi|internet)\b/, value: "WiFi" },
      { pattern: /\b(pool|swimming pool)\b/, value: "Swimming Pool" },
      { pattern: /\b(ac|air condition(ing|ed)?)\b/, value: "AC" },
      { pattern: /\b(parking|car park|valet)\b/, value: "Parking" },
      { pattern: /\b(gym|fitness|workout)\b/, value: "Gym" },
      { pattern: /\b(breakfast|complimentary breakfast)\b/, value: "Breakfast" },
      { pattern: /\b(spa|massage)\b/, value: "Spa" },
      { pattern: /\b(beach|sea view|ocean view)\b/, value: "Sea View" },
      { pattern: /\b(pet friendly|pets allowed)\b/, value: "Pet Friendly" },
    ];

    const detectedAmenities = amenityKeywords
      .filter((k) => k.pattern.test(lower))
      .map((k) => k.value);

    if (detectedAmenities.length > 0) {
      addToSet.preferredAmenities = { $each: detectedAmenities };
    }

    // 2. Budget extraction (e.g., "under 5000", "below ₹4000", "budget 3000 to 6000", "cheap")
    const budgetUnderMatch = lower.match(
      /(?:under|below|max|less than|within|budget of)\s*(?:₹|rs\.?|inr)?\s*(\d{3,6})/i
    );
    if (budgetUnderMatch) {
      const maxBudget = parseInt(budgetUnderMatch[1], 10);
      updates["preferredBudgetRange.max"] = maxBudget;
    }

    const budgetRangeMatch = lower.match(
      /(?:between|from)\s*(?:₹|rs\.?|inr)?\s*(\d{3,6})\s*(?:to|-|and)\s*(?:₹|rs\.?|inr)?\s*(\d{3,6})/i
    );
    if (budgetRangeMatch) {
      updates["preferredBudgetRange.min"] = parseInt(budgetRangeMatch[1], 10);
      updates["preferredBudgetRange.max"] = parseInt(budgetRangeMatch[2], 10);
    }

    // 3. Room type extraction (e.g., "suite", "deluxe", "single", "double")
    if (/\b(suite|presidential suite)\b/.test(lower)) updates.preferredRoomType = "suite";
    else if (/\b(deluxe|luxury)\b/.test(lower)) updates.preferredRoomType = "deluxe";
    else if (/\b(single room|single bed)\b/.test(lower)) updates.preferredRoomType = "single";
    else if (/\b(double room|twin bed)\b/.test(lower)) updates.preferredRoomType = "double";

    // 4. City preference extraction
    const cityMatch = lower.match(
      /\b(?:in|visit|traveling to|going to|hotel in)\s+([a-zA-Z]{3,20})\b/i
    );
    if (cityMatch && !["hotels", "deluxe", "somewhere", "anywhere", "luxury"].includes(cityMatch[1].toLowerCase())) {
      addToSet.preferredCities = cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1).toLowerCase();
    }

    // If any preference was identified, update Mongo
    const hasUpdates = Object.keys(updates).length > 0;
    const hasSetOps = Object.keys(addToSet).length > 0;

    if (hasUpdates || hasSetOps) {
      const updateDoc = {
        $inc: { interactionCount: 1 },
        $set: { ...updates, lastExtractedAt: new Date() },
      };
      if (hasSetOps) {
        updateDoc.$addToSet = addToSet;
      }

      return await UserPreference.findOneAndUpdate({ userId }, updateDoc, {
        upsert: true,
        new: true,
      });
    }

    return null;
  }

  /**
   * Format preferences as context prompt for agents
   */
  formatPreferencesForPrompt(pref) {
    if (!pref) return "No stored long-term preferences.";

    const parts = [];
    if (pref.preferredAmenities?.length) {
      parts.push(`- Preferred Amenities: ${pref.preferredAmenities.join(", ")}`);
    }
    if (pref.preferredBudgetRange?.max) {
      parts.push(`- Preferred Budget: Up to ₹${pref.preferredBudgetRange.max}/night`);
    }
    if (pref.preferredRoomType && pref.preferredRoomType !== "any") {
      parts.push(`- Preferred Room Type: ${pref.preferredRoomType}`);
    }
    if (pref.preferredCities?.length) {
      parts.push(`- Frequent Destinations: ${pref.preferredCities.slice(-3).join(", ")}`);
    }

    return parts.length > 0 ? parts.join("\n") : "No specific preferences recorded yet.";
  }
}

export const userPreferenceService = new UserPreferenceService();
