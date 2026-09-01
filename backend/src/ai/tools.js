import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Hotel } from "../models/hotel.models.js";
import { Booking } from "../models/booking.models.js";
import { Room } from "../models/room.models.js";
import { User } from "../models/user.models.js";
import { Review } from "../models/review.models.js";
import { Wishlist } from "../models/wishlist.models.js";
import { Waitlist } from "../models/waitlist.models.js";
import { Coupon } from "../models/coupone.models.js";
import mongoose from "mongoose";
import { calculateDynamicPrice } from "../utils/calculateDynamicPrice.utils.js";
import { Payment } from "../models/payment.models.js";
import { autoPromoteWaitlist } from "../controllers/waitlist.controllers.js";
import transporter from "../utils/sendEmail.utils.js";

export const createTools = (userId) => [
  new DynamicStructuredTool({
    name: "search_hotels",
    description: "Search for available hotels based on city and filters like price or rating.",

    schema: z.object({
      city: z.string().describe("City name"),
      sortByPrice: z.boolean().optional(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      guests: z.number().optional(),
    }),

    func: async ({ city, sortByPrice, checkIn, checkOut, guests }) => {
      try {
        const filter = { isActive: true, isApproved: true };

        if (city && city.toLowerCase() !== "any") {
          filter.$or = [
            { name: { $regex: city, $options: "i" } },
            { city: { $regex: city, $options: "i" } },
            { state: { $regex: city, $options: "i" } },
          ];
        }

        let query = Hotel.find(filter).select(
          "name city address basePrice amenities images avgRating totalReviews",
        );

        query = sortByPrice
          ? query.sort({ basePrice: 1 })
          : query.sort({ avgRating: -1 });

        const hotels = await query.limit(10);

        if (!hotels.length) {
          return "No hotels found matching your criteria.";
        }

        return JSON.stringify({
          success: true,
          totalFound: hotels.length,
          hotels: hotels.map((h, i) => ({
            rank: i + 1,
            hotelId: h._id,
            name: h.name,
            city: h.city,
            price: h.basePrice,
            rating: h.avgRating || 0,
          })),
        });
      } catch (err) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },
  }),


  //GET HOTEL DETAILS
  new DynamicStructuredTool({
    name: "get_hotel_details",
    description: "Get complete details about a specific hotel including available rooms.",
    schema: z.object({
      hotelId: z.string().describe("The ID of the hotel to fetch details for"),
    }),
    func: async ({ hotelId }) => {
      try {
     
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
          return JSON.stringify({
            success: false,
            error: "Invalid hotel ID format",
          });
        }

        const hotel = await Hotel.findById(hotelId).select(
          "name city state address basePrice amenities images avgRating totalReviews description mobileNumber",
        );

        if (!hotel) {
          return JSON.stringify({
            success: false,
            error: "Hotel not found",
          });
        }

        const rooms = await Room.find({
          hotelId,
          isAvailable: true,
        }).select(
          "title roomType pricePerDay totalRooms maxGuests amenities images",
        );

    
        const reviews = await Review.find({ hotelId })
          .populate("userId", "name")
          .sort({ createdAt: -1 })
          .limit(5)
          .select("rating message createdAt");

        return JSON.stringify({
          success: true,
          hotel: {
            hotelId: hotel._id,
            name: hotel.name,
            location: `${hotel.address}, ${hotel.city}, ${hotel.state}`,
            basePrice: `₹${hotel.basePrice}`,
            rating: hotel.avgRating || "No rating",
            totalReviews: hotel.totalReviews || 0,
            amenities: hotel.amenities,
            description: hotel.description || "No description available",
            contact: hotel.mobileNumber,
          },
          rooms: rooms.map((room) => ({
            roomId: room._id,
            title: room.title,
            type: room.roomType,
            pricePerDay: `₹${room.pricePerDay}`,
            availableRooms: room.totalRooms,
            maxGuests: room.maxGuests,
            amenities: room.amenities,
          })),
          recentReviews: reviews.map((r) => ({
            user: r.userId?.name || "Anonymous",
            rating: r.rating,
            comment: r.message?.substring(0, 50) + (r.message?.length > 50 ? "..." : ""),
            date: r.createdAt,
          })),
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error fetching hotel details: ${error.message}`,
        });
      }
    },
  }),


  // CHECK ROOM AVAILABILITY

  new DynamicStructuredTool({
    name: "check_room_availability",
    description: "Check if a specific room is available for given dates. Requires a roomId.",
    schema: z.object({
      roomId: z.string().describe("The 24-character hexadecimal ID of the room (e.g., '60d5ec...'). MUST be obtained from 'get_hotel_details'."),
      checkIn: z.string().describe("Check-in date in YYYY-MM-DD format"),
      checkOut: z.string().describe("Check-out date in YYYY-MM-DD format"),
    }),
    func: async ({ roomId, checkIn, checkOut }) => {
      try {
        
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(startDate) || isNaN(endDate)) {
          return JSON.stringify({
            success: false,
            error: "Invalid date format. Use YYYY-MM-DD",
          });
        }

        if (startDate < today) {
          return JSON.stringify({
            success: false,
            error: "Check-in date cannot be in the past",
          });
        }

        if (endDate <= startDate) {
          return JSON.stringify({
            success: false,
            error: "Check-out must be after check-in",
          });
        }

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
          return JSON.stringify({
            success: false,
            error: "Invalid roomId format. Please use the exact 24-character hexadecimal ID returned by 'search_hotels' or 'get_hotel_details'. DO NOT guess or invent IDs.",
          });
        }

        const room = await Room.findById(roomId);
        if (!room) {
          return JSON.stringify({
            success: false,
            error: "Room not found. Make sure you have the correct room ID from hotel details.",
          });
        }

      
        const overlappingBookings = await Booking.countDocuments({
          roomId,
          $or: [
            { status: "booked" },
            { status: "pending", holdExpiresAt: { $gt: new Date() } },
          ],
          checkIn: { $lt: endDate },
          checkOut: { $gt: startDate },
        });

        const availableRooms = room.totalRooms - overlappingBookings;
        const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

       
        const occupancyRate = overlappingBookings / room.totalRooms;
        const pricingInfo = await calculateDynamicPrice({
          basePrice: room.pricePerDay,
          checkIn: startDate,
          checkOut: endDate,
          hotelId: room.hotelId,
          occupancyRate,
        });

        const pricePerDay = pricingInfo.pricePerDay;
        const totalPrice = pricePerDay * nights;

        if (availableRooms > 0) {
          return JSON.stringify({
            success: true,
            available: true,
            hotelId: room.hotelId,
            roomId: room._id,
            roomsAvailable: availableRooms,
            totalRooms: room.totalRooms,
            nights,
            pricePerNight: `₹${pricePerDay}`,
            totalPrice: `₹${totalPrice}`,
            message: `${availableRooms} room(s) available. Total cost for ${nights} night(s): ₹${totalPrice}`,
          });
        } else {
          // Check waitlist option
          const waitlistCount = await Waitlist.countDocuments({
            roomId,
            status: "waiting",
          });

          return JSON.stringify({
            success: true,
            available: false,
            message: `No rooms available for these dates. ${waitlistCount} people are on the waitlist. Would you like to join the waitlist?`,
          });
        }
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error checking availability: ${error.message}`,
        });
      }
    },
  }),

  
  //CREATE BOOKING
  
  new DynamicStructuredTool({
    name: "create_booking",
    description: "Create a new booking for a specific room and hotel.",
    schema: z.object({
      hotelId: z.string().optional().describe("The 24-character hex ID of the hotel (from search results)."),
      roomId: z.string().describe("The 24-character hex ID of the room (from search results)"),
      checkIn: z.string().describe("Check-in date in YYYY-MM-DD format"),
      checkOut: z.string().describe("Check-out date in YYYY-MM-DD format"),
      totalGuest: z.number().describe("Total number of guests"),
      paymentMode: z.string().describe("The payment mode (STRIPE, RAZORPAY, or COD)"),
    }),
    func: async ({ hotelId, roomId, checkIn, checkOut, totalGuest, paymentMode }) => {
      paymentMode = paymentMode.toUpperCase();
      const validModes = ["STRIPE", "RAZORPAY", "COD"];
      if (!validModes.includes(paymentMode)) {
        return JSON.stringify({
          success: false,
          error: "Invalid payment mode. Please use STRIPE, RAZORPAY, or COD.",
        });
      }
      console.log(`[TOOL:create_booking] User: ${userId} | Hotel: ${hotelId} | Room: ${roomId} | Mode: ${paymentMode}`);
      try {
        // Validate inputs
        // Validate roomId first
        if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
          return JSON.stringify({
            success: false,
            error: "Invalid roomId format. Please use the exact 24-character hexadecimal ID returned by 'search_hotels' or 'get_hotel_details'. DO NOT guess or invent IDs.",
          });
        }

        // Fetch room to get hotelId if missing or to verify
        const room = await Room.findById(roomId);
        if (!room) {
          return JSON.stringify({
            success: false,
            error: "Room not found. Make sure you have the correct room ID.",
          });
        }

        // Validate dates
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
          return JSON.stringify({
            success: false,
            error: "Check-in date cannot be in the past",
          });
        }

        if (endDate <= startDate) {
          return JSON.stringify({
            success: false,
            error: "Check-out must be after check-in",
          });
        }

        // Use roomId's hotelId if hotelId is missing or invalid
        const effectiveHotelId = (hotelId && mongoose.Types.ObjectId.isValid(hotelId))
          ? hotelId
          : room.hotelId.toString();

        if (room.hotelId.toString() !== effectiveHotelId) {
          return JSON.stringify({
            success: false,
            error: "Room does not belong to the specified hotel",
          });
        }

        if (room.maxGuests < totalGuest) {
          return JSON.stringify({
            success: false,
            error: `Room capacity is ${room.maxGuests} guests. You requested ${totalGuest}.`,
          });
        }

        // Check availability
        const overlappingBookings = await Booking.countDocuments({
          roomId,
          $or: [
            { status: "booked" },
            { status: "pending", holdExpiresAt: { $gt: new Date() } },
          ],
          checkIn: { $lt: endDate },
          checkOut: { $gt: startDate },
        });

        if (overlappingBookings >= room.totalRooms) {
          return JSON.stringify({
            success: false,
            error: "Room not available for selected dates",
          });
        }

        // Calculate price
        const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const occupancyRate = overlappingBookings / room.totalRooms;

        const pricingInfo = await calculateDynamicPrice({
          basePrice: room.pricePerDay,
          checkIn: startDate,
          checkOut: endDate,
          hotelId,
          occupancyRate,
        });

        const pricePerDay = pricingInfo.pricePerDay;
        const totalPrice = pricePerDay * nights;

        // Create booking
        const booking = await Booking.create({
          userId,
          hotelId: effectiveHotelId,
          roomId,
          checkIn: startDate,
          checkOut: endDate,
          totalGuest,
          paymentMode: paymentMode.toUpperCase(),
          totalPrice,
          status: "pending",
          paymentStatus: "pending",
        });

        const hotel = await Hotel.findById(effectiveHotelId).select("name city");
        const user = await User.findById(userId).select("name email");
        // ── Send Confirmation Email ─────────────────────────────
        if (user && user.email) {
          try {
            const mailOptions = {
              from: `"StayNest Booking" <${process.env.SENDER_EMAIL}>`,
              to: user.email,
              subject: "✅ Booking Confirmed | Your Stay Details",
              html: `
          <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f8; padding:30px;">
            <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
        
              <!-- Header -->
              <div style="background:#0d6efd; padding:20px; text-align:center; color:#ffffff;">
                <h1 style="margin:0;">🏨 Booking Confirmed</h1>
                <p style="margin:5px 0 0;">We look forward to hosting you</p>
              </div>
        
              <!-- Body -->
              <div style="padding:25px; color:#333;">
                <p>Hi <strong>${user.name || "Valued Guest"}</strong>,</p>
        
                <p>Thank you for your booking! Your reservation has been successfully created. Below are your booking details:</p>
        
                <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; margin-top:15px;">
                  <tr>
                    <td style="border-bottom:1px solid #eee;"><strong>Booking ID</strong></td>
                    <td style="border-bottom:1px solid #eee;">${booking._id}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom:1px solid #eee;"><strong>Hotel</strong></td>
                    <td style="border-bottom:1px solid #eee;">${hotel.name}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom:1px solid #eee;"><strong>Room Type</strong></td>
                    <td style="border-bottom:1px solid #eee;">${room.title}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom:1px solid #eee;"><strong>Location</strong></td>
                    <td style="border-bottom:1px solid #eee;">${hotel.city}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom:1px solid #eee;"><strong>Check-in</strong></td>
                    <td style="border-bottom:1px solid #eee;">${startDate.toDateString()}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom:1px solid #eee;"><strong>Check-out</strong></td>
                    <td style="border-bottom:1px solid #eee;">${endDate.toDateString()}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom:1px solid #eee;"><strong>Guests</strong></td>
                    <td style="border-bottom:1px solid #eee;">${totalGuest}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom:1px solid #eee;"><strong>Payment Mode</strong></td>
                    <td style="border-bottom:1px solid #eee;">${paymentMode}</td>
                  </tr>
                  <tr>
                    <td style="font-size:16px;"><strong>Total Amount</strong></td>
                    <td style="font-size:16px; color:#0d6efd;"><strong>₹${totalPrice}</strong></td>
                  </tr>
                </table>
        
                <p style="margin-top:20px;">
                  If you need to modify or cancel your booking, please contact our support team.
                </p>
        
                <p>We wish you a comfortable and pleasant stay! 🌟</p>
        
                <p style="margin-top:25px;">
                  Regards,<br/>
                  <strong>StayNest Team</strong>
                </p>
              </div>
        
              <!-- Footer -->
              <div style="background:#f1f3f5; padding:15px; text-align:center; font-size:12px; color:#777;">
                <p style="margin:0;">This is an automated email. Please do not reply.</p>
              </div>
        
            </div>
          </div>
          `
            };
            await transporter.sendMail(mailOptions);
            console.log(`[TOOL:create_booking] Confirmation email sent to: ${user.email}`);
          } catch (mailErr) {
            console.error(`[TOOL:create_booking] Email delivery failed:`, mailErr.message);
          }
        }

        return JSON.stringify({
          success: true,
          booking: {
            id: booking._id,
            hotel: hotel.name,
            location: hotel.city,
            room: room.title,
            checkIn,
            checkOut,
            nights,
            guests: totalGuest,
            totalPrice: `₹${totalPrice}`,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            paymentMode: booking.paymentMode,
          },
          message:
            paymentMode === "COD"
              ? "Booking created! Please pay at hotel during check-in."
              : `Booking created! Complete payment to confirm. Booking ID: ${booking._id}`,
          paymentUrl:
            paymentMode === "COD"
              ? null
              : `${process.env.FRONTEND_URL}/payment/${booking._id}?method=${paymentMode}`,
          nextSteps:
            paymentMode === "COD"
              ? "Your booking is confirmed. Show booking ID at hotel reception."
              : "Please proceed to payment to confirm your booking.",
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error creating booking: ${error.message}`,
        });
      }
    },
  }),

  
  //  GET USER BOOKINGS
  
  new DynamicStructuredTool({
    name: "get_user_bookings",
    description: "Get all bookings for the current user. Returns list of past, current, and upcoming bookings.",
    schema: z.object({
      filter: z.string().default("upcoming").describe("Filter: 'upcoming', 'past', or 'canceled'"),
    }),
    func: async ({ filter }) => {
      console.log(`[TOOL:get_user_bookings] Fetching for User: ${userId}`);
      try {
        // Ensure userId is treated as an ObjectId for the query
        const queryUserId = mongoose.Types.ObjectId.isValid(userId) 
          ? new mongoose.Types.ObjectId(userId) 
          : userId;

        const bookings = await Booking.find({ userId: queryUserId })
          .populate("hotelId", "name city address")
          .populate("roomId", "title roomType")
          .sort({ createdAt: -1 });

        if (bookings.length === 0) {
          return JSON.stringify({
            success: true,
            bookings: [],
            message: `You have no bookings recorded in your history for the current account (ID: ${userId}).`,
          });
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const categorized = {
          upcoming: [],
          current: [],
          past: [],
          canceled: [],
        };

        bookings.forEach((booking) => {
          // Safety check: Ensure checkIn and checkOut exist and are Date-like
          if (!booking.checkIn || !booking.checkOut) return;

          const checkInDate = new Date(booking.checkIn);
          const checkOutDate = new Date(booking.checkOut);

          if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) return;

          const checkInStr = checkInDate.toISOString().split("T")[0];
          const checkOutStr = checkOutDate.toISOString().split("T")[0];

          const bookingData = {
            id: booking._id,
            hotel: booking.hotelId?.name || "N/A",
            city: booking.hotelId?.city || "N/A",
            room: booking.roomId?.title || "N/A",
            dates: `${checkInStr} to ${checkOutStr}`,
            guests: booking.totalGuest,
            price: `₹${booking.totalPrice}`,
            status: booking.status,
            payment: booking.paymentStatus,
          };

          if (booking.status === "canceled") {
            categorized.canceled.push(bookingData);
          } else if (checkOutStr < todayStr) {
            categorized.past.push(bookingData);
          } else if (checkInStr <= todayStr && checkOutStr >= todayStr) {
            categorized.current.push(bookingData);
          } else {
            categorized.upcoming.push(bookingData);
          }
        });

        // If too many bookings, return only a subset or a condensed version to avoid token limits
        const response = {
          success: true,
          total: bookings.length,
          upcoming: categorized.upcoming,
          current: categorized.current,
          canceled: categorized.canceled.slice(0, 5), // Only show recent cancellations
          past: categorized.past.slice(0, 5), // Only show recent past
        };

        return JSON.stringify(response);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error fetching bookings: ${error.message}`,
        });
      }
    },
  }),

  
  //  CANCEL BOOKING
  
  new DynamicStructuredTool({
    name: "cancel_booking",
    description: "Cancel an existing booking. Note: Full refund if canceled 24+ hours before check-in.",
    schema: z.object({
      bookingId: z.string().describe("The ID of the booking to cancel"),
    }),
    func: async ({ bookingId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
          return JSON.stringify({
            success: false,
            error: "Invalid booking ID format",
          });
        }

        const booking = await Booking.findOne({
          _id: bookingId,
          userId,
        });

        if (!booking) {
          return JSON.stringify({
            success: false,
            error: "Booking not found or doesn't belong to you",
          });
        }

        if (booking.status === "canceled") {
          return JSON.stringify({
            success: false,
            error: "Booking is already canceled",
          });
        }

        if (booking.status === "completed") {
          return JSON.stringify({
            success: false,
            error: "Cannot cancel completed booking",
          });
        }

        const now = new Date();
        const checkIn = new Date(booking.checkIn);

        if (checkIn <= now) {
          return JSON.stringify({
            success: false,
            error: "Cannot cancel booking that has already started",
          });
        }

        // Calculate refund using payment record if available (matching controller)
        const payment = await Payment.findOne({ userId, bookingId });
        const hoursBeforeCheckIn = (checkIn - now) / (1000 * 60 * 60);
        
        let refundAmount = 0;
        let refundMessage = "";

        if (booking.status === "pending") {
          refundAmount = payment ? payment.amount : booking.totalPrice;
          refundMessage = "Full refund (pending booking)";
        } else if (hoursBeforeCheckIn >= 24) {
          refundAmount = payment ? payment.amount : booking.totalPrice;
          refundMessage = "Full refund (canceled 24+ hours before check-in)";
        } else {
          refundAmount = 0;
          refundMessage = "No refund (less than 24 hours before check-in)";
        }

        // Cancel booking
        booking.status = "canceled";
      
        booking.paymentStatus = "success"; 
        await booking.save();

        // Promote waitlist (matching controller)
        await autoPromoteWaitlist();

        return JSON.stringify({
          success: true,
          message: "Booking canceled successfully",
          refund: {
            amount: `₹${refundAmount}`,
            message: refundMessage,
          },
          canceledBooking: {
            id: booking._id,
            hotel: booking.hotelId?.name,
            checkIn: booking.checkIn.toISOString().split("T")[0],
          },
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error canceling booking: ${error.message}`,
        });
      }
    },
  }),

  // 
  // RECOMMENDATIONS
  // 
  new DynamicStructuredTool({
    name: "fetch_personalized_recommendations",
    description: "Get personalized hotel recommendations and top-rated suggestions for the user. Use this when the user asks for recommendations, suggestions, or what they might like.",
    schema: z.object({
      preference: z.string().default("").describe("Optional preference like 'luxury' or 'budget'"),
    }),
    func: async ({ preference }) => {
      try {
        // Get user's booking history
        const pastBookings = await Booking.find({
          userId,
          status: { $in: ["completed", "booked"] },
        })
          .populate("hotelId")
          .populate("roomId")
          .limit(5);

        if (pastBookings.length === 0) {
          // New user - return popular hotels
          const popularHotels = await Hotel.find({
            isActive: true,
            isApproved: true,
          })
            .sort({ avgRating: -1, totalReviews: -1 })
            .limit(5)
            .select("name city basePrice amenities avgRating totalReviews");

          return JSON.stringify({
            success: true,
            type: "popular",
            message: "Here are our top-rated hotels",
            hotels: popularHotels.map((h) => ({
              id: h._id,
              name: h.name,
              city: h.city,
              price: `₹${h.basePrice}`,
              rating: h.avgRating || "New",
              reviews: h.totalReviews || 0,
            })),
          });
        }

        // Extract preferences
        const cities = [...new Set(pastBookings.map((b) => b.hotelId?.city))];
        const amenities = new Set();
        pastBookings.forEach((b) => {
          b.hotelId?.amenities?.forEach((a) => amenities.add(a));
        });

        // Find similar hotels
        const recommendations = await Hotel.find({
          isActive: true,
          isApproved: true,
          $or: [
            { city: { $in: cities } },
            { amenities: { $in: Array.from(amenities) } },
          ],
        })
          .limit(5)
          .select("name city basePrice amenities avgRating totalReviews");

        return JSON.stringify({
          success: true,
          type: "personalized",
          message: "Based on your previous stays, you might like these hotels",
          hotels: recommendations.map((h) => ({
            id: h._id,
            name: h.name,
            city: h.city,
            price: `₹${h.basePrice}`,
            rating: h.avgRating || "New",
            reviews: h.totalReviews || 0,
          })),
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error getting recommendations: ${error.message}`,
        });
      }
    },
  }),

  
  // ADD TO WISHLIST
  
  new DynamicStructuredTool({
    name: "add_to_wishlist",
    description: "Add a hotel or room to wishlist.",
    schema: z.object({
      hotelId: z.string().optional().describe("The ID of the hotel"),
      roomId: z.string().optional().describe("The ID of the room"),
    }),
    func: async ({ hotelId, roomId }) => {
      try {
        if (!hotelId && !roomId) {
          return JSON.stringify({
            success: false,
            error: "Either hotelId or roomId is required",
          });
        }

        // Check if already in wishlist
        const existing = await Wishlist.findOne({
          userId,
          ...(hotelId && { hotelId }),
          ...(roomId && { roomId }),
        });

        if (existing) {
          return JSON.stringify({
            success: false,
            error: "Already in your wishlist",
          });
        }

        await Wishlist.create({
          userId,
          hotelId: hotelId || null,
          roomId: roomId || null,
        });

        return JSON.stringify({
          success: true,
          message: "Added to wishlist successfully",
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error adding to wishlist: ${error.message}`,
        });
      }
    },
  }),

 
  // WISHLIST
  
  new DynamicStructuredTool({
    name: "get_wishlist",
    description: "Get user's wishlist.",
    schema: z.object({
      action: z.string().default("view").describe("Action to perform, usually 'view'"),
    }),
    func: async () => {
      try {
        const wishlist = await Wishlist.find({ userId })
          .populate("hotelId", "name city basePrice images")
          .populate("roomId", "title pricePerDay images");

        if (wishlist.length === 0) {
          return JSON.stringify({
            success: true,
            wishlist: [],
            message: "Your wishlist is empty",
          });
        }

        const items = wishlist.map((item) => ({
          id: item._id,
          type: item.hotelId ? "hotel" : "room",
          name: item.hotelId?.name || item.roomId?.title,
          city: item.hotelId?.city,
          price: item.hotelId
            ? `₹${item.hotelId.basePrice}`
            : `₹${item.roomId?.pricePerDay}`,
        }));

        return JSON.stringify({
          success: true,
          total: wishlist.length,
          wishlist: items,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error fetching wishlist: ${error.message}`,
        });
      }
    },
  }),


  // JOIN WAITLIST
  
  new DynamicStructuredTool({
    name: "join_waitlist",
    description: "Join waitlist for a fully booked room.",
    schema: z.object({
      roomId: z.string().describe("The ID of the room"),
      checkIn: z.string().describe("Check-in date in YYYY-MM-DD format"),
      checkOut: z.string().describe("Check-out date in YYYY-MM-DD format"),
      totalGuest: z.number().describe("Total number of guests"),
    }),
    func: async ({ roomId, checkIn, checkOut, totalGuest }) => {
      try {
        const room = await Room.findById(roomId).populate("hotelId", "name");
        if (!room) {
          return JSON.stringify({
            success: false,
            error: "Room not found",
          });
        }

        // Check if already on waitlist
        const existing = await Waitlist.findOne({
          userId,
          roomId,
          status: "waiting",
        });

        if (existing) {
          return JSON.stringify({
            success: false,
            error: "You're already on the waitlist for this room",
          });
        }

        const waitlist = await Waitlist.create({
          userId,
          hotelId: room.hotelId._id,
          roomId,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          totalGuest,
          status: "waiting",
        });

        // Get waitlist position
        const position = await Waitlist.countDocuments({
          roomId,
          status: "waiting",
          createdAt: { $lte: waitlist.createdAt },
        });

        return JSON.stringify({
          success: true,
          message: "Successfully joined waitlist",
          waitlist: {
            id: waitlist._id,
            hotel: room.hotelId.name,
            room: room.title,
            position,
            checkIn,
            checkOut,
          },
          note: "You'll be automatically notified if a room becomes available",
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error joining waitlist: ${error.message}`,
        });
      }
    },
  }),

  
  //APPLY COUPON

  new DynamicStructuredTool({
    name: "check_coupon",
    description: "Check if a coupon code is valid and get discount details.",
    schema: z.object({
      code: z.string().describe("The coupon code"),
      bookingAmount: z.number().describe("The total booking amount"),
    }),
    func: async ({ code, bookingAmount }) => {
      try {
        const coupon = await Coupon.findOne({
          code: code.toUpperCase(),
          isActive: true,
          expiryDate: { $gte: new Date() },
        });

        if (!coupon) {
          return JSON.stringify({
            success: false,
            error: "Invalid or expired coupon code",
          });
        }

        if (coupon.usedCount >= coupon.usageLimit) {
          return JSON.stringify({
            success: false,
            error: "Coupon usage limit reached",
          });
        }

        if (bookingAmount < coupon.minimumBookingAmount) {
          return JSON.stringify({
            success: false,
            error: `Minimum booking amount is ₹${coupon.minimumBookingAmount}`,
          });
        }

        let discountAmount = 0;
        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = (bookingAmount * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }

        discountAmount = Math.min(discountAmount, bookingAmount);
        const finalAmount = bookingAmount - discountAmount;

        return JSON.stringify({
          success: true,
          valid: true,
          coupon: {
            code: coupon.code,
            type: coupon.discountType,
            value:
              coupon.discountType === "PERCENTAGE"
                ? `${coupon.discountValue}%`
                : `₹${coupon.discountValue}`,
          },
          discount: `₹${discountAmount}`,
          finalAmount: `₹${finalAmount}`,
          savings: `You save ₹${discountAmount}!`,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error checking coupon: ${error.message}`,
        });
      }
    },
  }),

 
  //GET AVAILABLE COUPONS

  new DynamicStructuredTool({
    name: "get_available_coupons",
    description: "Get list of available coupons.",
    schema: z.object({
      minAmount: z.number().optional().describe("Minimum booking amount filter"),
    }),
    func: async ({ minAmount = 0 }) => {
      try {
        const coupons = await Coupon.find({
          isActive: true,
          expiryDate: { $gte: new Date() },
          $expr: { $lt: ["$usedCount", "$usageLimit"] },
          ...(minAmount > 0 && { minimumBookingAmount: { $lte: minAmount } }),
        }).select("code discountType discountValue minimumBookingAmount");

        if (coupons.length === 0) {
          return JSON.stringify({
            success: true,
            coupons: [],
            message: "No coupons available at the moment",
          });
        }

        const formatted = coupons.map((c) => ({
          code: c.code,
          discount:
            c.discountType === "PERCENTAGE"
              ? `${c.discountValue}% OFF`
              : `₹${c.discountValue} OFF`,
          minAmount: `₹${c.minimumBookingAmount}`,
        }));

        return JSON.stringify({
          success: true,
          total: coupons.length,
          coupons: formatted,
          message: `${coupons.length} coupon(s) available`,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error fetching coupons: ${error.message}`,
        });
      }
    },
  }),


  // GET USER PROFILE
 
  new DynamicStructuredTool({
    name: "get_user_profile",
    description: "Get current user's profile information.",
    schema: z.object({
      action: z.string().default("view").describe("Action to perform, usually 'view'"),
    }),
    func: async () => {
      try {
        const user = await User.findById(userId).select(
          "name email mobileNumber role profileImage",
        );

        if (!user) {
          return JSON.stringify({
            success: false,
            error: "User not found",
          });
        }

        // Get booking stats
        const bookingStats = await Booking.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]);

        const stats = {};
        bookingStats.forEach((s) => {
          stats[s._id] = s.count;
        });

        return JSON.stringify({
          success: true,
          profile: {
            name: user.name,
            email: user.email,
            phone: user.mobileNumber || "Not provided",
            role: user.role,
          },
          bookingStats: {
            total: Object.values(stats).reduce((a, b) => a + b, 0),
            completed: stats.completed || 0,
            upcoming: stats.booked || 0,
            canceled: stats.canceled || 0,
          },
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error fetching profile: ${error.message}`,
        });
      }
    },
  }),

  // COMPARE HOTELS

  new DynamicStructuredTool({
    name: "compare_hotels",
    description: "Compare two hotels side by side based on their names. This tool provides REAL data from the database. Use ONLY the fields returned here; DO NOT invent extra details.",
    schema: z.object({
      hotelName1: z.string().describe("The name of the first hotel"),
      hotelName2: z.string().describe("The name of the second hotel"),
    }),
    func: async ({ hotelName1, hotelName2 }) => {
      try {
        const findHotel = async (name) => {
          // Escape regex special chars if any
          const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(safeName, 'i');
          return Hotel.findOne({ name: regex, isActive: true, isApproved: true })
            .select("name city state address basePrice amenities avgRating totalReviews description");
        };

        const [hotel1, hotel2] = await Promise.all([
          findHotel(hotelName1),
          findHotel(hotelName2)
        ]);

        if (!hotel1 && !hotel2) {
          return JSON.stringify({ success: false, error: "Neither hotel was found." });
        }
        
        const formatHotel = (hotel, reqName) => {
          if (!hotel) return { requestedName: reqName, found: false, error: "Hotel not found in database." };
          return {
            found: true,
            id: hotel._id,
            name: hotel.name,
            location: `${hotel.city}, ${hotel.state}`,
            price: `₹${hotel.basePrice}`,
            rating: hotel.avgRating || "No rating",
            reviews: hotel.totalReviews || 0,
            amenities: hotel.amenities || [],
            description: hotel.description || "No description available",
            note: "USE ONLY THESE FIELDS. DO NOT HALLUCINATE EXTRA SPECS."
          };
        };

        return JSON.stringify({
          success: true,
          hotel1: formatHotel(hotel1, hotelName1),
          hotel2: formatHotel(hotel2, hotelName2),
          message: "Comparison successful."
        });
      } catch (error) {
        return JSON.stringify({ success: false, error: `Error comparing hotels: ${error.message}` });
      }
    }
  }),
  new DynamicStructuredTool({
    name: "clear_chat",
    description: "Clear your conversation history to start fresh.",
    schema: z.object({}),
    func: async () => {
      try {
        const db = mongoose.connection.db;
        const collection = db.collection("chat_history");
        await collection.deleteMany({ sessionId: userId });
        return JSON.stringify({
          success: true,
          message: "Conversation history cleared. You can start fresh now!",
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Error clearing history: ${error.message}`,
        });
      }
    },
  }),
];