import mongoose from "mongoose";

const { Schema } = mongoose;

const roomSchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true, // e.g. "Deluxe Sea View Room"
      trim: true
    },

    roomType: {
      type: String,
      enum: ["single", "double", "deluxe", "suite"],
      required: true
    },

    maxGuests: {
      type: Number,
      required: true,
      min: 1
    },

    pricePerDay: {
      type: Number,
      required: true,
      min: 0
    },

    totalRooms: {
      type: Number,
      required: true,
      min: 1
    },

    amenities: [
      {
        type: String,
        trim: true
      }
    ],

    images: [
      {
        type: String
      }
    ],

    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

roomSchema.index({ hotelId: 1 });
roomSchema.index({ pricePerDay: 1 });
roomSchema.index({ maxGuests: 1 });


export const Room = mongoose.model("Room", roomSchema);
