import mongoose, { Schema } from "mongoose";

const hotelSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique:true
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
    },

    basePrice: {
      type: Number,
      required: true,
    },

    images: [
      {
        type: String,
      },
    ],

    amenities: [
      {
        type: String,
      },
    ],

    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    isApproved: {
      type: Boolean,
      default: false, 
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    approvedBy:{type:String},
    approvedAt:{type:Date}
  },
  { timestamps: true }
);


hotelSchema.index({ location: "2dsphere" });

export const Hotel = mongoose.model("Hotel", hotelSchema);
