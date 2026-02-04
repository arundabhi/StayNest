import mongoose from "mongoose";
const { Schema } = mongoose;

const pricingSchema = new Schema(
  {
    name: {
      type: String,
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
      type: Number, 
      required: true,
      min: 0.1, 
      max: 10   
    },

    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    },
    specialOfferPercent:Number,          
    specialOfferAmount:Number
  },
  { timestamps: true }
);

export const Pricing = mongoose.model("Pricing", pricingSchema);
