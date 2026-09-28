import { Hotel } from "../../models/hotel.models.js";
import { Room } from "../../models/room.models.js";
import { Booking } from "../../models/booking.models.js";
import { Review } from "../../models/review.models.js";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import mongoose from "mongoose";

export class OwnerAnalyticsAgent {
  constructor() {
    this.llm = new ChatGroq({
      model: process.env.MODEL || "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.2,
      streaming: false,
    });
  }

  /**
   * Run analytical aggregation queries for a specific hotel owner
   */
  async getOwnerAnalytics(ownerId, hotelId = null) {
    try {
      const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
      const hotelFilter = { owner: ownerObjectId };
      if (hotelId && mongoose.Types.ObjectId.isValid(hotelId)) {
        hotelFilter._id = new mongoose.Types.ObjectId(hotelId);
      }

      const hotels = await Hotel.find(hotelFilter).lean();
      if (!hotels.length) {
        return {
          hasData: false,
          message: "No registered hotels found under your owner account.",
        };
      }

      const targetHotelIds = hotels.map((h) => h._id);

      // 1. Total & Monthly Revenue
      const revenueStats = await Booking.aggregate([
        {
          $match: {
            hotelId: { $in: targetHotelIds },
            status: { $in: ["booked", "completed"] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            totalBookings: { $sum: 1 },
            avgBookingValue: { $avg: "$totalPrice" },
          },
        },
      ]);

      // 2. Cancellation Statistics
      const cancellationStats = await Booking.aggregate([
        {
          $match: {
            hotelId: { $in: targetHotelIds },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // 3. Room Performance Breakdown
      const roomPerformance = await Booking.aggregate([
        {
          $match: {
            hotelId: { $in: targetHotelIds },
            status: { $in: ["booked", "completed"] },
          },
        },
        {
          $group: {
            _id: "$roomId",
            bookingCount: { $sum: 1 },
            roomRevenue: { $sum: "$totalPrice" },
          },
        },
        { $sort: { roomRevenue: -1 } },
      ]);

      // 4. Populate Room titles
      const rooms = await Room.find({ hotelId: { $in: targetHotelIds } }).lean();
      const roomMap = new Map(rooms.map((r) => [r._id.toString(), r]));

      const roomBreakdown = roomPerformance.map((rp) => {
        const roomDoc = roomMap.get(rp._id?.toString());
        return {
          roomTitle: roomDoc?.title || "Standard Room",
          roomType: roomDoc?.roomType || "Standard",
          totalBookings: rp.bookingCount,
          totalRevenue: rp.roomRevenue,
        };
      });

      // 5. Recent Review Sentiments
      const reviews = await Review.find({ hotelId: { $in: targetHotelIds } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("rating message")
        .lean();

      return {
        hasData: true,
        hotelNames: hotels.map((h) => h.name).join(", "),
        totalHotels: hotels.length,
        revenueSummary: revenueStats[0] || { totalRevenue: 0, totalBookings: 0, avgBookingValue: 0 },
        cancellationSummary: cancellationStats,
        roomPerformance: roomBreakdown,
        recentReviews: reviews,
      };
    } catch (error) {
      console.error("[OWNER ANALYTICS] Aggregation error:", error);
      return { hasData: false, error: error.message };
    }
  }

  /**
   * Process owner analytical question with prescriptive business insights
   */
  async analyze(ownerId, query, hotelId = null) {
    try {
      const stats = await this.getOwnerAnalytics(ownerId, hotelId);

      if (!stats.hasData) {
        return stats.message || "No performance data available yet for your properties.";
      }

      const systemPrompt = `You are the StayNest Executive Revenue & Hospitality Analytics Advisor for Hotel Owners.
Analyze the database metrics and provide an executive-level performance assessment and actionable growth recommendations.

Structure your response with:
1. 📊 **Executive Performance Summary** (Revenue, Booking Volume, Average Order Value)
2. 🛏️ **Room Yield & Performance Analysis** (Identify top-grossing vs under-performing rooms)
3. 📉 **Cancellation & Leakage Insights** (Assess cancellation rate and friction points)
4. ⭐ **Guest Sentiment & Quality Signals** (Key themes from guest feedback)
5. 🚀 **Actionable Revenue Growth Recommendations** (Specific pricing tactics, seasonal offers, amenity upgrades)`;

      const userPrompt = `Owner Query: "${query}"

Verified Property Metrics:
${JSON.stringify(stats, null, 2)}`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      return response?.content?.trim() || "Could not generate owner analytics at this time.";
    } catch (error) {
      console.error("[OWNER ANALYTICS] LLM analysis error:", error);
      return `❌ Error generating analytics insights: ${error.message}`;
    }
  }
}

export const ownerAnalyticsAgent = new OwnerAnalyticsAgent();
