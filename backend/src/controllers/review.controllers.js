import { Booking } from "../models/booking.models.js";
import { Review } from "../models/review.models.js";
import mongoose from "mongoose";
import { updateHotelRating } from "../utils/updateHotelRating.js";

export const addReview = async (req, res) => {
  try {
    const { message, rating } = req.body;
    const userId = req.userId;
    const { roomId, hotelId } = req.params;

    // Auth
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Validation
    if (!message || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "Message and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (!roomId && !hotelId) {
      return res.status(400).json({
        success: false,
        message: "Room id or Hotel id is required",
      });
    }

    // ✅ Check completed booking
    const booking = await Booking.findOne({
      userId,
      hotelId,
      roomId,
      status: "completed",
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: "You can review only after completing the booking",
      });
    }

    // ✅ Prevent duplicate review
    const existingReview = await Review.findOne({
      userId,
      hotelId,
      roomId,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this",
      });
    }

    // ✅ Create review
    const review = await Review.create({
      userId,
      hotelId,
      roomId,
      message,
      rating,
    });
    await updateHotelRating(review.hotelId);

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });

  } catch (error) {
    console.error("Add review error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;

    // Auth
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Review id is required",
      });
    }

    // Find review
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Ownership check
    if (!review.userId.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this review",
      });
    }

    await review.deleteOne();
    await updateHotelRating(hotelId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });

  } catch (error) {
    console.error("Delete review error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserReview = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const [reviews, totalReviews] = await Promise.all([
      Review.find({ userId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("hotelId", "name city")
        .populate("roomId", "title"),

      Review.countDocuments({ userId }),
    ]);

    const totalPages = Math.ceil(totalReviews / limit);

    return res.status(200).json({
      success: true,
      message: "User reviews fetched successfully",
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      reviews,
    });

  } catch (error) {
    console.error("get user review error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getHotelReviews = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "HotelId is required",
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const [reviews, totalReviews] = await Promise.all([
      Review.find({ hotelId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("userId", "name")
        .populate("roomId", "roomType amenities totalGuest"),

      Review.countDocuments({ hotelId }),
    ]);

    const totalPages = Math.ceil(totalReviews / limit);

    return res.status(200).json({
      success: true,
      message: "Hotel reviews fetched successfully",
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      reviews,
    });

  } catch (error) {
    console.error("get hotel reviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getHotelRating = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "HotelId is required",
      });
    }

    const stats = await Review.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotelId),
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalReviews = stats.reduce((sum, item) => sum + item.count, 0);
    const breakdown = {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    };

    let totalRatingSum = 0;

    stats.forEach((item) => {
      breakdown[item._id].count = item.count;
      breakdown[item._id].percentage = totalReviews
        ? Math.round((item.count / totalReviews) * 100)
        : 0;

      totalRatingSum += item._id * item.count;
    });

    const avgRating = totalReviews
      ? Number((totalRatingSum / totalReviews).toFixed(1))
      : 0;

    return res.status(200).json({
      success: true,
      avgRating,
      totalReviews,
      breakdown,
    });

  } catch (error) {
    console.error("rating breakdown error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
