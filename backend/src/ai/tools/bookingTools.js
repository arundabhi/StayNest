import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Booking } from "../../models/booking.models.js";
import { Hotel } from "../../models/hotel.models.js";
import { Room } from "../../models/room.models.js";
import { Wishlist } from "../../models/wishlist.models.js";
import { Waitlist } from "../../models/waitlist.models.js";
import { conversationStateService } from "../state/conversationState.service.js";
import mongoose from "mongoose";

export const createBookingTools = (userId, sessionId) => [
  // 1. Create Booking
  new DynamicStructuredTool({
    name: "create_booking",
    description: "Create a confirmed or pending booking record in StayNest.",
    schema: z.object({
      hotelId: z.string().describe("The MongoDB ObjectId of the hotel"),
      roomId: z.string().describe("The MongoDB ObjectId of the room"),
      checkIn: z.string().describe("Check-in date (YYYY-MM-DD)"),
      checkOut: z.string().describe("Check-out date (YYYY-MM-DD)"),
      guests: z.number().describe("Number of guests"),
      paymentMode: z.enum(["STRIPE", "RAZORPAY", "COD", "stripe", "razorpay", "cod"]).describe("Payment method"),
    }),
    func: async ({ hotelId, roomId, checkIn, checkOut, guests, paymentMode }) => {
      try {
        const mode = paymentMode.toUpperCase();
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const nights = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

        const room = await Room.findById(roomId);
        if (!room) {
          return JSON.stringify({ success: false, error: "Room not found" });
        }

        const totalPrice = room.pricePerDay * nights;

        const booking = await Booking.create({
          userId: new mongoose.Types.ObjectId(userId),
          hotelId: new mongoose.Types.ObjectId(hotelId),
          roomId: new mongoose.Types.ObjectId(roomId),
          checkIn: startDate,
          checkOut: endDate,
          totalGuest: guests,
          totalPrice,
          basePrice: room.pricePerDay,
          paymentMode: mode,
          status: mode === "COD" ? "booked" : "pending",
          paymentStatus: mode === "COD" ? "pending" : "pending",
          holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        let paymentUrl = null;

        if (mode === "STRIPE" && process.env.STRIPE_SECRET_KEY) {
          try {
            const Stripe = (await import("stripe")).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            const hotel = await Hotel.findById(hotelId);
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ["card"],
              mode: "payment",
              line_items: [
                {
                  price_data: {
                    currency: "inr",
                    product_data: {
                      name: `Hotel Booking - ${hotel?.name || "Hotel Stay"}`,
                      description: `${room.title} (${checkIn} to ${checkOut})`,
                    },
                    unit_amount: Math.round(totalPrice * 100),
                  },
                  quantity: 1,
                },
              ],
              metadata: {
                bookingId: booking._id.toString(),
                userId: userId.toString(),
              },
              success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&bookingId=${booking._id}`,
              cancel_url: `${frontendUrl}/payment-failed?bookingId=${booking._id}`,
            });

            const { Payment } = await import("../../models/payment.models.js");
            await Payment.create({
              userId,
              bookingId: booking._id,
              amount: totalPrice,
              paymentMode: "STRIPE",
              paymentStatus: "processing",
              stripeSessionId: session.id,
            });

            paymentUrl = session.url;
          } catch (stripeErr) {
            console.error("[TOOL create_booking] Stripe session error:", stripeErr.message);
            paymentUrl = `${frontendUrl}/payment/${booking._id}`;
          }
        } else if (mode !== "COD") {
          paymentUrl = `${frontendUrl}/payment/${booking._id}`;
        }

        // Update state to confirmed
        if (sessionId) {
          await conversationStateService.updateState(sessionId, {
            pendingBooking: {
              hotelId,
              roomId,
              checkIn,
              checkOut,
              guests,
              nights,
              totalPrice,
              paymentMethod: mode.toLowerCase(),
              status: "confirmed",
              bookingId: booking._id.toString(),
              paymentUrl,
            },
            currentStep: "BOOKING_CONFIRMED",
          });
        }

        return JSON.stringify({
          success: true,
          bookingId: booking._id.toString(),
          status: booking.status,
          totalPrice,
          paymentMode: mode,
          paymentUrl,
          message: mode === "COD" ? "Booking confirmed!" : "Booking reserved. Please complete payment.",
        });
      } catch (err) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },
  }),

  // 2. Get User Bookings
  new DynamicStructuredTool({
    name: "get_user_bookings",
    description: "Fetch upcoming, active, or past bookings for the authenticated user.",
    schema: z.object({
      filter: z.enum(["upcoming", "all", "past", "canceled"]).optional(),
    }),
    func: async ({ filter = "upcoming" }) => {
      try {
        const query = { userId: new mongoose.Types.ObjectId(userId) };
        const now = new Date();

        if (filter === "upcoming") {
          query.checkOut = { $gte: now };
          query.status = { $ne: "canceled" };
        } else if (filter === "canceled") {
          query.status = "canceled";
        }

        const bookings = await Booking.find(query)
          .populate("hotelId", "name city address")
          .populate("roomId", "title roomType")
          .sort({ checkIn: -1 })
          .limit(5)
          .lean();

        return JSON.stringify({
          success: true,
          total: bookings.length,
          bookings: bookings.map((b) => ({
            bookingId: b._id.toString(),
            hotelName: b.hotelId?.name || "Hotel",
            city: b.hotelId?.city || "N/A",
            roomType: b.roomId?.title || b.roomId?.roomType || "Standard",
            checkIn: b.checkIn?.toISOString().split("T")[0],
            checkOut: b.checkOut?.toISOString().split("T")[0],
            totalPrice: `₹${b.totalPrice}`,
            status: b.status,
            paymentMode: b.paymentMode,
          })),
        });
      } catch (err) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },
  }),

  // 3. Cancel Booking
  new DynamicStructuredTool({
    name: "cancel_booking",
    description: "Cancel an active booking by booking ID.",
    schema: z.object({
      bookingId: z.string().describe("The MongoDB ObjectId of the booking"),
    }),
    func: async ({ bookingId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
          return JSON.stringify({ success: false, error: "Invalid bookingId" });
        }

        const booking = await Booking.findOne({
          _id: bookingId,
          userId: new mongoose.Types.ObjectId(userId),
        });

        if (!booking) {
          return JSON.stringify({
            success: false,
            error: "Booking not found or not authorized to cancel.",
          });
        }

        booking.status = "canceled";
        booking.paymentStatus = "canceled";
        await booking.save();

        return JSON.stringify({
          success: true,
          message: `Booking ${bookingId} has been successfully canceled.`,
        });
      } catch (err) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },
  }),

  // 4. Wishlist Management
  new DynamicStructuredTool({
    name: "add_to_wishlist",
    description: "Save a hotel to user's personal wishlist.",
    schema: z.object({
      hotelId: z.string().describe("The ID of the hotel to bookmark"),
    }),
    func: async ({ hotelId }) => {
      try {
        await Wishlist.findOneAndUpdate(
          { userId, hotelId },
          { userId, hotelId },
          { upsert: true }
        );
        return JSON.stringify({ success: true, message: "Hotel added to your wishlist." });
      } catch (err) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },
  }),
];
