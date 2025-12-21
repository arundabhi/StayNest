import mongoose from "mongoose";
const { Schema } = mongoose;

const pricingSchema = new Schema({
  name: {
    type: String, // Diwali, New Year
    required: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  multiplier: {
    type: Number, // 1.2, 1.5, 2.0
    required: true
  },

  hotelId: {
    type: Schema.Types.ObjectId,
    ref: "Hotel"
  }
}, { timestamps: true });

export const Pricing = mongoose.model("Pricing", pricingSchema);
