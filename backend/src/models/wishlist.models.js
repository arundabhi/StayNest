import mongoose, { Schema } from "mongoose";

const wishlistSchema = new Schema(
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
    },
  },
  { timestamps: true }
);

wishlistSchema.index(
  { userId: 1, hotelId: 1, roomId: 1 },
  { unique: true }
);

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);
