import { User } from '../models/user.models.js';
import bcrypt from 'bcrypt'
import validator from 'validator'
import generateAccessAndRefreshToken from '../utils/token.utils.js'
import crypto from "crypto";
import uploadCloudinary from '../utils/cloudinary.utils.js';
import jwt from 'jsonwebtoken'
import { sendEmail,emailTemplates } from '../utils/sendEmail.utils.js';
import {
  validateEmail,
  validatePassword,
  sanitizeInput,
  validatePhoneNumber
} from "../utils/validate.utils.js";

export const registerUser = async (req, res) => {
  try {
    let { name, email, password, mobileNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
    name = sanitizeInput(name);
    email = validateEmail(email);
    password = validatePassword(password);
    mobileNumber = validatePhoneNumber(mobileNumber)

    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }
    
    const existingUser = await User.findOne({
      $or: [{ email }, { mobileNumber }],
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImageUrl = "";

    if (req.file) {
      const result = await uploadCloudinary(req.file.buffer);
      profileImageUrl = result.secure_url;
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      profileImage: profileImageUrl,
    });

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage:user.profileImage
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing credentials",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
    );

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




export const logoutUser = async (req, res) => {
  await User.findByIdAndUpdate(req.userId, {
    $unset: { refreshToken: 1 },
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token",
      });
    }


    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        success: true,
        accessToken,
      });

  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

   
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, OTP has been sent",
      });
    }

   
    const otp = crypto.randomInt(100000, 999999).toString();

   
    const hashedOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    user.resetPasswordToken = hashedOtp;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; 

    await user.save({ validateBeforeSave: false });

  
    await sendEmail({
      to: email,
      subject: "Reset Password OTP",
      body: `
        <h2>Password Reset</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 15 minutes.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {

    const { email, newPassword,otp } = req.body;

    if (!otp || !email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "OTP, email and password are required",
      });
    }

 
    const hashedOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }


    user.password = await bcrypt.hash(newPassword, 10);

    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.refreshToken = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const ownerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const owner = await User.findOne({ email });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

 
    if (owner.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not an owner account",
      });
    }

   
    const isPasswordMatch = await bcrypt.compare(password, owner.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }


    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(owner);

 
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        success: true,
        message: "Owner login successful",
        accessToken,
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          role: owner.role
        },
      });

  } catch (error) {
    console.error("OWNER LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};