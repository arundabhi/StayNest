import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Hotel } from "../../models/hotel.models.js";
import { Room } from "../../models/room.models.js";
import { Review } from "../../models/review.models.js";
import { conversationStateService } from "../state/conversationState.service.js";
import { calculateDynamicPrice } from "../../utils/calculateDynamicPrice.utils.js";
import { Booking } from "../../models/booking.models.js";
import mongoose from "mongoose";

export const createHotelTools = (userId, sessionId) => [
  // 1. Search Hotels
  new DynamicStructuredTool({
    name: "search_hotels",
    description: "Search for available hotels by city or name. Returns top matched hotels with pricing and ratings.",
    schema: z.object({
      city: z.string().describe("The city name to search in (e.g. 'Somnath', 'Goa', 'Mumbai')"),
      maxPrice: z.number().optional().describe("Optional maximum budget per night"),
      amenities: z.array(z.string()).optional().describe("Optional amenities filter (e.g. ['WiFi', 'Pool'])"),
    }),
    func: async ({ city, maxPrice, amenities }) => {
      try {
        const filter = { isActive: true, isApproved: true };

        if (city && city.toLowerCase() !== "any") {
          filter.$or = [
            { city: { $regex: city, $options: "i" } },
            { name: { $regex: city, $options: "i" } },
            { state: { $regex: city, $options: "i" } },
          ];
        }

        if (maxPrice) {
          filter.basePrice = { $lte: maxPrice };
        }

        if (amenities && amenities.length > 0) {
          filter.amenities = { $all: amenities };
        }

        const hotels = await Hotel.find(filter)
          .select("name city address basePrice amenities avgRating totalReviews images")
          .sort({ avgRating: -1, basePrice: 1 })
          .limit(6)
          .lean();

        if (!hotels.length) {
          return JSON.stringify({
            success: false,
            message: `No hotels found matching criteria in ${city}.`,
          });
        }

        // Record in conversation state for reference resolution
        if (sessionId) {
          await conversationStateService.setRecentlyRecommendedHotels(
            sessionId,
            hotels,
            city,
            userId
          );
        }

        return JSON.stringify({
          success: true,
          totalFound: hotels.length,
          hotels: hotels.map((h, i) => ({
            rank: i + 1,
            hotelId: h._id.toString(),
            name: h.name,
            city: h.city,
            pricePerNight: `₹${h.basePrice}`,
            rating: h.avgRating || 4.5,
            reviewsCount: h.totalReviews || 0,
            amenities: h.amenities || [],
          })),
        });
      } catch (err) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },
  }),

  // 2. Get Hotel Details
  new DynamicStructuredTool({
    name: "get_hotel_details",
    description: "Fetch comprehensive room listings, amenities, and guest reviews for a specific hotel ID.",
    schema: z.object({
      hotelId: z.string().describe("The 24-character hexadecimal MongoDB ID of the hotel"),
    }),
    func: async ({ hotelId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
          return JSON.stringify({ success: false, error: "Invalid hotelId format" });
        }

        const hotel = await Hotel.findById(hotelId).lean();
        if (!hotel) {
          return JSON.stringify({ success: false, error: "Hotel not found" });
        }

        const rooms = await Room.find({ hotelId, isAvailable: true }).lean();
        const reviews = await Review.find({ hotelId })
          .populate("userId", "name")
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();

        // Update state
        if (sessionId) {
          await conversationStateService.setSelectedHotel(sessionId, hotel, userId);
        }

        return JSON.stringify({
          success: true,
          hotel: {
            hotelId: hotel._id.toString(),
            name: hotel.name,
            city: hotel.city,
            address: hotel.address,
            basePrice: `₹${hotel.basePrice}`,
            rating: hotel.avgRating || "New",
            amenities: hotel.amenities || [],
            description: hotel.description,
          },
          rooms: rooms.map((r, i) => ({
            optionNumber: i + 1,
            roomId: r._id.toString(),
            title: r.title,
            roomType: r.roomType,
            pricePerDay: `₹${r.pricePerDay}`,
            maxGuests: r.maxGuests,
            totalRooms: r.totalRooms,
            amenities: r.amenities || [],
          })),
          recentReviews: reviews.map((rev) => ({
            author: rev.userId?.name || "Guest",
            rating: rev.rating,
            comment: rev.message,
          })),
        });
      } catch (err) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },
  }),

  // 3. Check Room Availability & Dynamic Price
  new DynamicStructuredTool({
    name: "check_room_availability",
    description: "Check availability and compute accurate dynamic pricing for a given room and date range.",
    schema: z.object({
      roomId: z.string().describe("The 24-char ObjectId of the room"),
      checkIn: z.string().describe("Check-in date in YYYY-MM-DD format"),
      checkOut: z.string().describe("Check-out date in YYYY-MM-DD format"),
      guests: z.number().optional().describe("Number of guests"),
    }),
    func: async ({ roomId, checkIn, checkOut, guests = 2 }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
          return JSON.stringify({ success: false, error: "Invalid roomId format" });
        }

        const room = await Room.findById(roomId).lean();
        if (!room) {
          return JSON.stringify({ success: false, error: "Room not found" });
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const nights = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

        // Conflict check
        const overlapping = await Booking.countDocuments({
          roomId,
          $or: [
            { status: "booked" },
            { status: "pending", holdExpiresAt: { $gt: new Date() } },
          ],
          checkIn: { $lt: endDate },
          checkOut: { $gt: startDate },
        });

        const availableRooms = room.totalRooms - overlapping;
        const occupancyRate = overlapping / room.totalRooms;

        const pricingInfo = await calculateDynamicPrice({
          basePrice: room.pricePerDay,
          checkIn: startDate,
          checkOut: endDate,
          hotelId: room.hotelId,
          occupancyRate,
        });

        const pricePerNight = pricingInfo.pricePerDay;
        const totalPrice = pricePerNight * nights;

        // Auto-update state with room and dates
        if (sessionId) {
          await conversationStateService.setSelectedRoom(sessionId, room, userId);
          await conversationStateService.setBookingDetails(
            sessionId,
            { checkIn, checkOut, guests, nights, totalPrice },
            userId
          );
        }

        return JSON.stringify({
          success: true,
          isAvailable: availableRooms > 0,
          availableRoomsCount: Math.max(0, availableRooms),
          nights,
          pricePerNight: `₹${pricePerNight}`,
          totalPrice: `₹${totalPrice}`,
          roomId: room._id.toString(),
          hotelId: room.hotelId.toString(),
        });
      } catch (err) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },
  }),
];
