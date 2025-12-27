import { User } from '../models/user.models.js';
import bcrypt from 'bcrypt'
import validator from 'validator'
import generateAccessAndRefreshToken from '../utils/token.utils.js'
import crypto from "crypto";
import uploadCloudinary from '../utils/cloudinary.utils.js';
import jwt from 'jsonwebtoken'
import { sendEmail,emailTemplates } from '../utils/sendEmail.utils.js';


export const registerUser = async (req, res) => {
  try {
    const { name, email, password, mobileNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
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
      return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log("Login error",error)
    res.status(500).json({ success: false, message: "Server error" });
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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const accessToken = user.generateAccessToken();

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    res.status(403).json({ message: "Invalid refresh token" });
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
        success: false,
        message: "User does not exits",
      });
    }


    const resetToken = crypto.randomBytes(32).toString("hex");


    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save({ validateBeforeSave: false });


    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // TODO: send email (nodemailer)
    console.log("Reset URL:", resetUrl);
    await sendEmail({
  to: email,
  subject: 'Reset Password',
  html: emailTemplates.resetPassword(resetUrl)
});

    return res.status(200).json({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.refreshToken = undefined; // logout all sessions

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const ownerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find owner
    const owner = await User.findOne({ email });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    // 3️⃣ Check role
    if (owner.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not an owner account",
      });
    }

    // 4️⃣ Password check
    const isPasswordMatch = await bcrypt.compare(password, owner.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 5️⃣ Generate tokens
    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(owner);

    // 6️⃣ Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    // 7️⃣ Response
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