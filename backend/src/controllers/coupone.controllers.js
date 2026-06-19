import { Booking } from "../models/booking.models.js";
import { Coupon } from "../models/coupone.models.js";
import { Hotel } from "../models/hotel.models.js";
import mongoose from "mongoose";



export const createCoupon = async (req, res) => {
  try {
    const user = req.user;

    if (!['admin', 'owner'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized. Admin or Owner only",
      });
    }

    const {
      code,
      expiryDate,
      discountType,
      discountValue,
      usageLimit,
      minimumBookingAmount = 0,
      hotelId,
    } = req.body;

    if (!code || !expiryDate || !discountType || !discountValue || !usageLimit) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    if (user.role === "owner") {
      if (!hotelId) {
        return res.status(400).json({
          success: false,
          message: "Hotel ID is required for owner coupons",
        });
      }
      const hotel = await Hotel.findOne({ _id: hotelId, owner: user._id });
      if (!hotel) {
        return res.status(403).json({
          success: false,
          message: "You do not own this hotel",
        });
      }
    }

    const couponData = {
      code: code.toUpperCase().trim(),
      expiryDate,
      discountType,
      discountValue,
      usageLimit,
      minimumBookingAmount,
    };

    if (hotelId) couponData.hotelId = hotelId;
    if (user && user._id) couponData.createdBy = user._id;
    else if (mongoose.Types.ObjectId.isValid(req.userId)) couponData.createdBy = req.userId;

    const coupon = await Coupon.create(couponData);

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });

  } catch (error) {
    console.error("create coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const user = req.user;
    const { couponId } = req.params;

   
    if (!['owner', 'admin'].includes(user.role)) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Coupon Id is required",
      });
    }

    const {
      expiryDate,
      discountType,
      discountValue,
      usageLimit,
      minimumBookingAmount,
      hotelId,
    } = req.body;

    if (
      !expiryDate &&
      !discountType &&
      discountValue === undefined &&
      usageLimit === undefined &&
      minimumBookingAmount === undefined &&
      hotelId === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update",
      });
    }

    if (user.role === "owner" && hotelId) {
      const hotel = await Hotel.findOne({ _id: hotelId, owner: user._id });
      if (!hotel) {
        return res.status(403).json({
          success: false,
          message: "You do not own this hotel",
        });
      }
    }

    const updatedData = {};
    if (expiryDate) updatedData.expiryDate = expiryDate;
    if (discountType) updatedData.discountType = discountType;
    if (discountValue !== undefined) updatedData.discountValue = discountValue;
    if (usageLimit !== undefined) updatedData.usageLimit = usageLimit;
    if (minimumBookingAmount !== undefined)
      updatedData.minimumBookingAmount = minimumBookingAmount;
    if (hotelId !== undefined) {
      updatedData.hotelId = hotelId || null;
    }

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { $set: updatedData },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });

  } catch (error) {
    console.error("Update coupon error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const user = req.user;
    const { couponId } = req.params;

    if (!['owner', 'admin'].includes(user.role)) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized",
      });
    }

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Coupon Id is required",
      });
    }

    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });

  } catch (error) {
    console.error("delete coupon error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllCoupon = async (req, res) => {
  try {
    const user = req.user;


    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admin can view all coupons",
      });
    }


    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;


    const [coupons, totalCoupons] = await Promise.all([
      Coupon.find()
        .populate("hotelId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Coupon.countDocuments(),
    ]);

    if (coupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No coupons found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupons fetched successfully",
      meta: {
        totalCoupons,
        currentPage: page,
        totalPages: Math.ceil(totalCoupons / limit),
        pageSize: limit,
      },
      coupons,
    });

  } catch (error) {
    console.error("get all coupon error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const user = req.user;
    const { couponId } = req.params;


    if (!['owner', 'admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized",
      });
    }

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Coupon Id is required",
      });
    }

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon fetched successfully",
      coupon,
    });

  } catch (error) {
    console.error("get coupon by id error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const toggleCouponState = async (req, res) => {
  try {
    const user = req.user;
    const { couponId } = req.params;

    if (!['owner', 'admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized",
      });
    }

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Coupon Id is required",
      });
    }

    const coupon = await Coupon.findByIdAndUpdate(
  couponId,
  [
    { $set: { isActive: { $not: "$isActive" } } }
  ],
  {
    new: true,
    updatePipeline: true, 
  }
);


    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully`,
      coupon,
    });

  } catch (error) {
    console.error("toggle coupon state error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const applyCoupon = async (req, res) => {
  try {
    const userId = req.userId;
    const { code } = req.body;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login",
      });
    }

    if (!bookingId || !code) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and coupon code are required",
      });
    }
    

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: userId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
    if (booking.status !== "pending") {
  return res.status(400).json({
    success: false,
    message: "Coupon can only be applied to pending bookings",
  });
}


    if (booking.couponApplied) {
      return res.status(400).json({
        success: false,
        message: "Coupon already applied to this booking",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiryDate: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired coupon",
      });
    }

    if (booking.totalPrice < coupon.minimumBookingAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking amount is ${coupon.minimumBookingAmount}`,
      });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    let discountAmount = 0;

    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (booking.totalPrice * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, booking.totalPrice);


    booking.totalPrice -= discountAmount;
    booking.couponApplied = true;
    booking.couponCode = coupon.code;

    coupon.usedCount += 1;

    await Promise.all([booking.save(), coupon.save()]);

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discountAmount,
      finalPrice: booking.totalPrice,
    });

  } catch (error) {
    console.error("apply coupon error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const userId = req.userId;
    const { code, bookingAmount, hotelId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login",
      });
    }

    if (!code || bookingAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and booking amount are required",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiryDate: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired coupon",
      });
    }

    if (coupon.hotelId && coupon.hotelId.toString() !== hotelId) {
      return res.status(400).json({
        success: false,
        message: "This coupon is only applicable for a specific hotel",
      });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    if (bookingAmount < coupon.minimumBookingAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking amount is ${coupon.minimumBookingAmount}`,
      });
    }

    let discountAmount = 0;

    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (bookingAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, bookingAmount);

    return res.status(200).json({
      success: true,
      message: "Coupon is valid",
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount,
      finalAmount: bookingAmount - discountAmount,
    });

  } catch (error) {
    console.error("validate coupon error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.userId;


    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login",
      });
    }

    const today = new Date();

    const query = {
      isActive: true,
      expiryDate: { $gte: today },
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
    };

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .select("-__v");

    if (coupons.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No available coupons",
        coupons: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Available coupons fetched successfully",
      coupons,
    });

  } catch (error) {
    console.error("get available coupons error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getOwnerCoupons = async (req, res) => {
  try {
    const user = req.user;
    if (!['owner', 'admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const hotels = await Hotel.find({ owner: user._id });
    const hotelIds = hotels.map(h => h._id);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { createdBy: user._id },
        { hotelId: { $in: hotelIds } }
      ]
    };

    const [coupons, totalCoupons] = await Promise.all([
      Coupon.find(query)
        .populate("hotelId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Coupon.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Owner coupons fetched successfully",
      meta: {
        totalCoupons,
        currentPage: page,
        totalPages: Math.ceil(totalCoupons / limit),
        pageSize: limit,
      },
      coupons,
    });
  } catch (error) {
    console.error("get owner coupons error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
