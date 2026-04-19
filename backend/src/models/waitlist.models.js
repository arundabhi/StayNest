import mongoose, { Schema } from "mongoose";

const waitlistSchema = new Schema(
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
    },

    status: {
      type: String,
      enum: ["waiting", "promoted", "expired"],
      default: "waiting",
      index: true,
    },

    priority: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);
waitlistSchema.index({ roomId: 1, status: 1, createdAt: 1 });
export const Waitlist = mongoose.model("Waitlist", waitlistSchema);
