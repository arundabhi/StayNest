import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
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
      default: null,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    isApproved: {
      type: Boolean,
      default: true, 
    },
  },
  { timestamps: true }
);

reviewSchema.index(
  { userId: 1, hotelId: 1, roomId: 1 },
  { unique: true }
);

export const Review = mongoose.model("Review", reviewSchema);
