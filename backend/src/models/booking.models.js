import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },
    totalGuest: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["COD", "PAYTM", "RAZORPAY", "STRIPE"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "booked", "completed", "canceled"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum:  ["pending", "processing", "success", "failed", "canceled"],
      default: "pending",
    },
    discountAmount: Number,    
    basePrice: Number,    
    couponApplied: { type: Boolean, default: false },
    couponCode: String

  },
  { timestamps: true }
);
bookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 }); 
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ hotelId: 1, createdAt: -1 });

bookingSchema.pre("save", async function () {
  console.log("Pre save");

  if (this.checkOut <= this.checkIn) {
    throw new Error("Check-out date must be after check-in date");
  }
});


export const Booking = mongoose.model("Booking", bookingSchema);
