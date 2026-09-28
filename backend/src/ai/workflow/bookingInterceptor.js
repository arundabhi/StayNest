import { Booking } from "../../models/booking.models.js";
import { Hotel } from "../../models/hotel.models.js";
import { Room } from "../../models/room.models.js";
import { conversationStateService } from "../state/conversationState.service.js";
import { entityResolver } from "./entityResolver.js";
import mongoose from "mongoose";

export class BookingInterceptor {
  /**
   * Check if the message is an explicit booking confirmation or cancellation
   * and intercept before delegating to LangChain agent.
   */
  async intercept(userId, message, state) {
    if (!state || !state.pendingBooking) {
      return null;
    }

    const { status } = state.pendingBooking;
    const { resolvedEntities } = entityResolver.resolve(message, state);

    // ─────────────────────────────────────────────────────────────
    // CASE 1: USER SAYS YES / CONFIRM WHILE AWAITING CONFIRMATION
    // ─────────────────────────────────────────────────────────────
    if (
      (status === "awaiting_confirmation" ||
        state.currentStep === "AWAITING_CONFIRMATION") &&
      resolvedEntities.isConfirmation
    ) {
      console.log(
        `[WORKFLOW INTERCEPTOR] Direct booking confirmation triggered for user: ${userId}`
      );

      return await this.executeDirectBooking(userId, state);
    }

    // ─────────────────────────────────────────────────────────────
    // CASE 2: USER SAYS NO / CANCEL WHILE AWAITING CONFIRMATION
    // ─────────────────────────────────────────────────────────────
    if (
      (status === "awaiting_confirmation" ||
        state.currentStep === "AWAITING_CONFIRMATION") &&
      resolvedEntities.isCancellation
    ) {
      console.log(
        `[WORKFLOW INTERCEPTOR] Booking cancellation requested for user: ${userId}`
      );

      // Reset pending booking
      await conversationStateService.updateState(state.sessionId, {
        pendingBooking: undefined,
        currentStep: "IDLE",
      });

      return {
        intercepted: true,
        success: true,
        response:
          "🚫 **Booking Cancelled.** I've cleared the pending reservation.\n\nHow else can I assist you today? You can search for other hotels or ask for travel recommendations.",
        intent: "action",
        resolvedBy: "workflow_interceptor_cancel",
      };
    }

    // Not intercepted, let the workflow engine / agent handle it
    return null;
  }

  /**
   * Directly executes database booking creation from structured state
   */
  async executeDirectBooking(userId, state) {
    const sessionId = state.sessionId;
    const pending = state.pendingBooking;

    try {
      const hotelId = pending.hotelId || state.selectedHotel?.hotelId;
      const roomId = pending.roomId || state.selectedRoom?.roomId;
      const checkIn = pending.checkIn || state.bookingDetails?.checkIn;
      const checkOut = pending.checkOut || state.bookingDetails?.checkOut;
      const guests = pending.guests || state.bookingDetails?.guests || 1;
      const paymentMethod = (
        pending.paymentMethod ||
        state.paymentMethod ||
        "cod"
      ).toUpperCase();

      if (!hotelId || !roomId || !checkIn || !checkOut) {
        return {
          intercepted: true,
          success: false,
          response:
            "⚠️ Some booking details are missing. Let's restart your reservation. Which city would you like to visit?",
          intent: "action",
          resolvedBy: "workflow_interceptor_error",
        };
      }

      // 1. Verify Hotel & Room in DB
      const hotel = await Hotel.findById(hotelId);
      const room = await Room.findById(roomId);

      if (!hotel || !room) {
        return {
          intercepted: true,
          success: false,
          response:
            "⚠️ The selected hotel or room is no longer available. Please search again.",
          intent: "action",
          resolvedBy: "workflow_interceptor_error",
        };
      }

      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);
      const nights = Math.max(
        1,
        Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      );
      const totalPrice = pending.totalPrice || room.pricePerDay * nights;

      // 2. Overlapping booking conflict check
      const overlappingBookings = await Booking.countDocuments({
        roomId,
        $or: [
          { status: "booked" },
          { status: "pending", holdExpiresAt: { $gt: new Date() } },
        ],
        checkIn: { $lt: endDate },
        checkOut: { $gt: startDate },
      });

      if (room.totalRooms - overlappingBookings <= 0) {
        return {
          intercepted: true,
          success: false,
          response: `😔 Unfortunately, **${room.title}** at **${hotel.name}** is fully booked for those dates. Would you like to join the waitlist or choose another room?`,
          intent: "action",
          resolvedBy: "workflow_interceptor_unavailable",
        };
      }

      // 3. Create Booking Record
      const newBooking = await Booking.create({
        userId: new mongoose.Types.ObjectId(userId),
        hotelId: new mongoose.Types.ObjectId(hotelId),
        roomId: new mongoose.Types.ObjectId(roomId),
        checkIn: startDate,
        checkOut: endDate,
        totalGuest: guests,
        totalPrice,
        basePrice: room.pricePerDay,
        paymentMode: paymentMethod,
        status: paymentMethod === "COD" ? "booked" : "pending",
        paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
        holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins hold for online payment
      });

      const frontendUrl =
        process.env.FRONTEND_URL || "http://localhost:5173";
      let paymentUrl = null;

      if (paymentMethod === "STRIPE" && process.env.STRIPE_SECRET_KEY) {
        try {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
              {
                price_data: {
                  currency: "inr",
                  product_data: {
                    name: `Hotel Booking - ${hotel.name}`,
                    description: `${room.title} (${checkIn} to ${checkOut})`,
                  },
                  unit_amount: Math.round(totalPrice * 100),
                },
                quantity: 1,
              },
            ],
            metadata: {
              bookingId: newBooking._id.toString(),
              userId: userId.toString(),
            },
            success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&bookingId=${newBooking._id}`,
            cancel_url: `${frontendUrl}/payment-failed?bookingId=${newBooking._id}`,
          });

          const { Payment } = await import("../../models/payment.models.js");
          await Payment.create({
            userId,
            bookingId: newBooking._id,
            amount: totalPrice,
            paymentMode: "STRIPE",
            paymentStatus: "processing",
            stripeSessionId: session.id,
          });

          paymentUrl = session.url;
        } catch (stripeErr) {
          console.error("[WORKFLOW INTERCEPTOR] Stripe session error:", stripeErr.message);
          paymentUrl = `${frontendUrl}/payment/${newBooking._id}`;
        }
      } else if (paymentMethod !== "COD") {
        paymentUrl = `${frontendUrl}/payment/${newBooking._id}`;
      }

      // 4. Update Conversation State to CONFIRMED
      await conversationStateService.updateState(sessionId, {
        pendingBooking: {
          ...pending,
          status: "confirmed",
          bookingId: newBooking._id.toString(),
          paymentUrl,
        },
        currentStep: "BOOKING_CONFIRMED",
      });

      // 5. Construct Deterministic Confirmed Response
      let responseText = "";

      if (paymentMethod === "COD") {
        responseText = `🎉 **Booking Confirmed!**\n\n` +
          `✅ **Booking ID:** \`${newBooking._id}\`\n` +
          `🏨 **Hotel:** ${hotel.name} (${hotel.city})\n` +
          `🛏️ **Room:** ${room.title} (${room.roomType})\n` +
          `📅 **Dates:** ${checkIn} to ${checkOut} (${nights} night${nights > 1 ? "s" : ""})\n` +
          `👥 **Guests:** ${guests}\n` +
          `💰 **Total Price:** ₹${totalPrice.toLocaleString("en-IN")}\n` +
          `💳 **Payment:** Pay at Hotel (Cash on Arrival)\n\n` +
          `📌 *Please show your Booking ID at reception during check-in. Have a wonderful stay!* 🌟`;
      } else {
        const isStripeLive = paymentUrl && paymentUrl.includes("checkout.stripe.com");
        const actionText = isStripeLive ? "Pay Securely with Card on Stripe" : "Complete Payment Online";

        responseText = `🎉 **Reservation Created!**\n\n` +
          `✅ **Booking ID:** \`${newBooking._id}\`\n` +
          `🏨 **Hotel:** ${hotel.name} (${hotel.city})\n` +
          `🛏️ **Room:** ${room.title}\n` +
          `📅 **Dates:** ${checkIn} to ${checkOut} (${nights} night${nights > 1 ? "s" : ""})\n` +
          `💰 **Total Amount:** ₹${totalPrice.toLocaleString("en-IN")}\n` +
          `💳 **Payment Method:** ${paymentMethod}\n\n` +
          `👉 **[💳 ${actionText} (Click to Pay)](${paymentUrl})**\n\n` +
          `[REDIRECT_TO_PAYMENT: ${paymentUrl}]\n\n` +
          `⚠️ *Your room is held for 15 minutes. Redirecting to payment...*`;
      }

      return {
        intercepted: true,
        success: true,
        response: responseText,
        bookingId: newBooking._id.toString(),
        paymentUrl,
        intent: "action",
        resolvedBy: "workflow_interceptor_direct_booking",
      };
    } catch (error) {
      console.error("[WORKFLOW INTERCEPTOR] Booking execution failed:", error);
      return {
        intercepted: true,
        success: false,
        response: `❌ We encountered an issue finalizing your booking: ${error.message}. Please try again.`,
        intent: "action",
        resolvedBy: "workflow_interceptor_error",
      };
    }
  }
}

export const bookingInterceptor = new BookingInterceptor();
