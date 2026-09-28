import { Hotel } from "../../models/hotel.models.js";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export class TravelPlannerService {
  constructor() {
    this.model = new ChatGroq({
      model: process.env.MODEL || "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.4,
      streaming: false,
    });
  }

  /**
   * Generate an end-to-end multi-day travel itinerary with StayNest hotel integration
   */
  async generateItinerary(city, days = 3, userPreferences = null) {
    try {
      // 1. Fetch real hotels in StayNest database for that city
      const hotels = await Hotel.find({
        city: { $regex: city, $options: "i" },
        isActive: true,
      })
        .select("name basePrice amenities avgRating address")
        .limit(3)
        .lean();

      let hotelContext = "No active StayNest partner hotels in this city yet.";
      if (hotels.length > 0) {
        hotelContext = hotels
          .map(
            (h, i) =>
              `${i + 1}. **${h.name}** — ₹${h.basePrice}/night (Rating: ⭐ ${h.avgRating || "New"}) | Amenities: ${h.amenities?.join(", ")} | Location: ${h.address}`
          )
          .join("\n");
      }

      const systemPrompt = `You are the StayNest AI Luxury Travel & Itinerary Architect.
Your role is to craft unforgettable, practical, and highly realistic multi-day travel itineraries.
Follow this structured markdown template:

# 🌟 {Days}-Day Curated Travel Itinerary for {City}

## 🏨 Recommended Stays on StayNest
(Recommend the real partner hotels provided in the context below. If none provided, recommend top verified locations.)

## 🗺️ Day-by-Day Detailed Plan
For each day include:
- **Morning (8:00 AM - 12:00 PM):** Primary landmark / temple visit, best darshan timings, avoiding crowds
- **Afternoon (12:30 PM - 4:00 PM):** Cultural sights, authentic local lunch recommendation, rest
- **Evening (5:00 PM - 9:00 PM):** Sunset points, beach walks, evening aarti/cultural shows, fine dining / street food hubs

## 🍽️ Must-Try Local Cuisine & Best Dining Spots
- Specific regional delicacies
- Top recommended hygienic food spots / thalis

## 💰 Realistic Budget Estimate (Per Person)
- Accommodation: ₹X
- Food & Dining: ₹Y
- Sightseeing & Local Transport: ₹Z
- **Total Estimated Budget:** ₹Total

## 💡 Insider Travel Tips & Cultural Etiquette
- Dress code for spiritual places / temples
- Best transport mode (Auto / Taxi / Rental)
- Best photo spots & season advice

Always format with beautiful markdown, bullet points, and emojis.`;

      const userPrompt = `Destination: ${city}
Duration: ${days} days
User Stored Preferences: ${userPreferences ? JSON.stringify(userPreferences) : "None specified"}

Available StayNest Partner Hotels in ${city}:
${hotelContext}

Please generate a comprehensive, exciting, and ready-to-book travel guide.`;

      const response = await this.model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      return response?.content?.trim() || "Could not generate itinerary at this time.";
    } catch (error) {
      console.error("[TRAVEL PLANNER] Itinerary generation error:", error);
      return `❌ An error occurred while generating the travel itinerary for ${city}: ${error.message}`;
    }
  }
}

export const travelPlannerService = new TravelPlannerService();
