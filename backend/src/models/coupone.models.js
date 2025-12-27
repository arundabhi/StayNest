import mongoose, { Schema } from "mongoose";

const couponSchema = new Schema(
  {
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

export const Coupon = mongoose.model("Coupon", couponSchema);
