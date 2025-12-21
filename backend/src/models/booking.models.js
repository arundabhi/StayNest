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
      enum: ["pending", "booked", "waitlist", "canceled"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "confirm", "canceled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

bookingSchema.pre("save", function (next) {
  if (this.checkOut <= this.checkIn) {
    return next(new Error("Check-out date must be after check-in date"));
  }
  next();
});

export const Booking = mongoose.model("Booking", bookingSchema);
