import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    sender: {
      type: String,
      enum: ["user", "hotel"],
      required: true,
    },

    message: {
      type: String,
      trim: true,
      required: true,
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
  },
  {
    timestamps: true,
  }
);
chatSchema.index({ userId: 1, hotelId: 1, createdAt: -1 }); // ✅ Chat history

export const Chat = mongoose.model("Chat", chatSchema);
