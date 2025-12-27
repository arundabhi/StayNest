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
  },
  multiplier: {
  type: Number,
  required: true,
  min: 0.1, // ✅ Add min
  max: 10   // ✅ Add max (prevent crazy multipliers)
}
}, { timestamps: true });

export const Pricing = mongoose.model("Pricing", pricingSchema);
