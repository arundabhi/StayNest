import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";




const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
    },
    mobileNumber: { type: String, unique: true },

    profileImage: { type: String },

    isVerified: { type: Boolean, default: false },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },

    refreshToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
