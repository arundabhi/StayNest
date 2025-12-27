import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["COD", "STRIPE", "RAZORPAY"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum:["pending", "processing", "success", "failed", "canceled"],
      default: "pending",
    },

    // Stripe
    stripeSessionId: String,

    // Razorpay
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
