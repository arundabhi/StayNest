import mongoose, { Schema } from "mongoose";

const couponSchema = new Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: false
    },
    usedCount: {
      type: Number,
      default: 0
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    discountType: {
      type: String,
      enum: ["FLAT", "PERCENTAGE"],
      required: true
    },

    discountValue: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
            if (this.discountType === "PERCENTAGE") {
                return value <= 100;
            }
            return true;
            },
            message: "Percentage discount cannot exceed 100"
        }                                         
    },

    expiryDate: {
      type: Date,
      required: true
    },

    usageLimit: {
      type: Number,
      required: true,
      min: 1
    },

    minimumBookingAmount: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

couponSchema.index({ hotelId: 1, isActive: 1, expiryDate: 1 });
couponSchema.index({ code: 1, isActive: 1 });

export const Coupon = mongoose.model("Coupon", couponSchema);
