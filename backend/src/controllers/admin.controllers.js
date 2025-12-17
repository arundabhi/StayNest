
import { User } from '../models/user.models.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = jwt.sign(
      { role: "admin" },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Admin logged in",
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const createOwner = async (req, res) => {
  try {
    const { name, email, mobileNumber, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { mobileNumber }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const owner = await User.create({
      name,
      email,
      mobileNumber,
      password: hashedPassword,
      role: "owner",
    });

    return res.status(201).json({
      success: true,
      message: "Hotel owner created successfully",
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOwners = async (req,res) => {
  try {
    const owners = await User.find({role:"owner"}).select('-password -refreshToken')
    res.status(200).json({success:true,count:owners.length,owners});
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}