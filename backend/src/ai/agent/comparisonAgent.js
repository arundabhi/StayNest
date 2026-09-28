import { Hotel } from "../../models/hotel.models.js";
import { Room } from "../../models/room.models.js";
import { Review } from "../../models/review.models.js";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export class ComparisonAgent {
  constructor() {
    this.llm = new ChatGroq({
      model: process.env.MODEL || "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.2,
      streaming: false,
    });
  }

  /**
   * Compare two or more hotels by name or IDs
   */
  async compareHotels(hotelQueryA, hotelQueryB, city = null) {
    try {
      const searchConditions = [];
      if (hotelQueryA) {
        searchConditions.push({ name: { $regex: hotelQueryA.trim(), $options: "i" } });
      }
      if (hotelQueryB) {
        searchConditions.push({ name: { $regex: hotelQueryB.trim(), $options: "i" } });
      }

      let hotels = await Hotel.find({
        $or: searchConditions.length > 0 ? searchConditions : [{ isActive: true }],
        ...(city ? { city: { $regex: city, $options: "i" } } : {}),
      })
        .limit(4)
        .lean();

      if (hotels.length < 2) {
        // Fallback: pick top 2 hotels in the city
        hotels = await Hotel.find(city ? { city: { $regex: city, $options: "i" }, isActive: true } : { isActive: true })
          .sort({ avgRating: -1 })
          .limit(2)
          .lean();
      }

      if (hotels.length < 2) {
        return "⚠️ I need at least two hotels to generate a side-by-side comparison. Please specify hotel names (e.g. 'Compare Somnath Resort and Beach Palace').";
      }

      const hotelIds = hotels.map((h) => h._id);
      const rooms = await Room.find({ hotelId: { $in: hotelIds } }).lean();
      const reviews = await Review.find({ hotelId: { $in: hotelIds } }).lean();

      // Aggregate comparison data
      const hotelData = hotels.map((h) => {
        const hotelRooms = rooms.filter((r) => r.hotelId.toString() === h._id.toString());
        const hotelReviews = reviews.filter((r) => r.hotelId.toString() === h._id.toString());
        return {
          id: h._id,
          name: h.name,
          city: h.city,
          address: h.address,
          basePrice: h.basePrice,
          rating: h.avgRating || "New",
          reviewCount: h.totalReviews || hotelReviews.length,
          amenities: h.amenities || [],
          roomTypes: hotelRooms.map((r) => `${r.title} (₹${r.pricePerDay})`),
          hasPool: (h.amenities || []).some((a) => /pool/i.test(a)),
          hasWifi: (h.amenities || []).some((a) => /wifi|internet/i.test(a)),
          hasAC: (h.amenities || []).some((a) => /ac|air/i.test(a)),
          cancellationPolicy: "Free cancellation up to 24 hours prior to check-in",
        };
      });

      const systemPrompt = `You are the StayNest AI Comparative Hospitality Analyst.
Present a comprehensive, objective, and beautifully structured comparison table comparing the provided hotels.

Output format:
1. **Overview Summary**
2. **Side-by-Side Comparison Table** using Markdown syntax with columns:
   | Feature | ${hotelData.map((h) => h.name).join(" | ")} |
   Include rows for: Base Price/Night, Rating & Reviews, WiFi Included, Swimming Pool, Air Conditioning, Popular Room Types, Proximity/Location, Cancellation Policy.
3. **Key Highlights & Pros/Cons for each hotel**
4. **Final Recommendation Verdict** based on travel styles (e.g. Best for Families vs. Best for Budget vs. Best for Luxury).`;

      const userPrompt = `Please compare these hotels using this verified database data:
${JSON.stringify(hotelData, null, 2)}`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      return response?.content?.trim() || "Unable to generate comparison table at this moment.";
    } catch (error) {
      console.error("[COMPARISON AGENT] Comparison error:", error);
      return `❌ Error generating hotel comparison: ${error.message}`;
    }
  }
}

export const comparisonAgent = new ComparisonAgent();
