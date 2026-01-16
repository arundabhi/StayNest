import mongoose from "mongoose";
const { Schema } = mongoose;

const pricingSchema = new Schema(
  {
    name: {
      type: String, // e.g. Diwali, New Year, Peak Season
      required: true,
      trim: true
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
      required: true,
      min: 0.1, // prevent zero / negative pricing
      max: 10   // prevent insane prices
    },

    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    }
  },
  { timestamps: true }
);

export const Pricing = mongoose.model("Pricing", pricingSchema);
