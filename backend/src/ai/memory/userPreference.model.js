import mongoose from "mongoose";

const { Schema } = mongoose;

const userPreferenceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    preferredCities: [{ type: String, trim: true }],
    preferredBudgetRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 20000 },
      currency: { type: String, default: "INR" },
    },
    preferredAmenities: [{ type: String, trim: true }], // e.g. "WiFi", "Swimming Pool", "AC", "Breakfast"
    preferredRoomType: {
      type: String,
      enum: ["single", "double", "deluxe", "suite", "any"],
      default: "any",
    },
    preferredHotelCategories: [{ type: String, trim: true }], // e.g. "beach resort", "heritage", "budget", "business"
    dietaryOrAccessibility: [{ type: String, trim: true }],
    interactionCount: { type: Number, default: 0 },
    lastExtractedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserPreference = mongoose.model(
  "UserPreference",
  userPreferenceSchema
);
