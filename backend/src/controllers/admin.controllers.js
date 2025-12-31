
import { User } from '../models/user.models.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Hotel } from '../models/hotel.models.js';


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
      {
        id: "SYSTEM_ADMIN",
        role: "admin",
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
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

export const approveHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    if (hotel.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Hotel already approved",
      });
    }


    hotel.isApproved = true;
    hotel.approvedBy = req.userId;
    hotel.approvedAt = new Date();
    await hotel.save();

    await User.findByIdAndUpdate(
      hotel.owner,
      { role: "owner" },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Hotel approved and user promoted to owner",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllHotelsAdmin = async (req, res) => {
  try {
    const hotels = await Hotel.find()
      .populate("owner", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: hotels.length,
      hotels,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRegisteredHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ isApproved: false });

    return res.status(200).json({
      success: true,
      message: hotels.length
        ? "Registered hotels fetched"
        : "No registered hotels found",
      hotels,
    });

  } catch (error) {
    console.error("Get registered hotels error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
