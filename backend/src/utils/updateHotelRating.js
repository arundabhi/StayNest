import { Hotel } from "../models/hotel.models.js";
import { Review } from "../models/review.models.js";
import mongoose from "mongoose";

export const updateHotelRating = async (hotelId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
      },
    },
    {
      $group: {
        _id: "$hotelId",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const avgRating = stats.length
    ? Number(stats[0].avgRating.toFixed(1))
    : 0;

  const totalReviews = stats.length ? stats[0].totalReviews : 0;

  await Hotel.findByIdAndUpdate(hotelId, {
    avgRating,
    totalReviews,
  });
};