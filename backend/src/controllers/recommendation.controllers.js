// recommendation.controllers.js
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";
import { Booking } from "../models/booking.models.js";
import { Review } from "../models/review.models.js";
import { Wishlist } from "../models/wishlist.models.js";
import { User } from "../models/user.models.js";

// 🎯 1. Personalized Recommendations (Based on User History)
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Get user's past bookings
    const pastBookings = await Booking.find({
      userId,
      status: { $in: ["completed", "booked"] },
    })
      .populate("hotelId")
      .populate("roomId")
      .limit(10)
      .sort({ createdAt: -1 });

    if (pastBookings.length === 0) {
      // New user - return popular hotels
      return getPopularHotels(req, res);
    }

    // Extract user preferences
    const preferences = {
      cities: [],
      priceRange: { min: Infinity, max: 0 },
      amenities: new Set(),
      roomTypes: new Set(),
    };

    pastBookings.forEach((booking) => {
      if (booking.hotelId) {
        preferences.cities.push(booking.hotelId.city);
        preferences.amenities = new Set([
          ...preferences.amenities,
          ...booking.hotelId.amenities,
        ]);
      }

      if (booking.roomId) {
        preferences.roomTypes.add(booking.roomId.roomType);
        const price = booking.totalPrice / booking.totalGuest || 0;
        preferences.priceRange.min = Math.min(
          preferences.priceRange.min,
          price
        );
        preferences.priceRange.max = Math.max(
          preferences.priceRange.max,
          price
        );
      }
    });

    // Build recommendation query
    const query = {
      isActive: true,
      isApproved: true,
      $or: [
        { city: { $in: preferences.cities } },
        { amenities: { $in: Array.from(preferences.amenities) } },
      ],
    };

    // Price range (with 20% buffer)
    if (preferences.priceRange.max > 0) {
      query.basePrice = {
        $gte: preferences.priceRange.min * 0.8,
        $lte: preferences.priceRange.max * 1.2,
      };
    }

    // Get recommended hotels
    const recommendations = await Hotel.find(query)
      .populate({
        path: "owner",
        select: "name",
      })
      .limit(10)
      .sort({ avgRating: -1 });

    // Calculate match score for each hotel
    const scoredRecommendations = recommendations.map((hotel) => {
      let score = 0;

      // City match
      if (preferences.cities.includes(hotel.city)) score += 30;

      // Amenities match
      const matchedAmenities = hotel.amenities.filter((a) =>
        preferences.amenities.has(a)
      );
      score += matchedAmenities.length * 10;

      // Rating bonus
      score += hotel.avgRating * 5;

      return {
        ...hotel.toObject(),
        matchScore: Math.min(score, 100),
        reason: getRecommendationReason(hotel, preferences),
      };
    });

    // Sort by match score
    scoredRecommendations.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      message: "Personalized recommendations",
      count: scoredRecommendations.length,
      recommendations: scoredRecommendations,
      preferences: {
        cities: [...new Set(preferences.cities)],
        amenities: Array.from(preferences.amenities).slice(0, 5),
        priceRange: preferences.priceRange,
      },
    });
  } catch (error) {
    console.error("Personalized recommendations error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Helper function to generate reason text
const getRecommendationReason = (hotel, preferences) => {
  const reasons = [];

  if (preferences.cities.includes(hotel.city)) {
    reasons.push(`You've stayed in ${hotel.city} before`);
  }

  const matchedAmenities = hotel.amenities.filter((a) =>
    preferences.amenities.has(a)
  );
  if (matchedAmenities.length > 0) {
    reasons.push(`Has ${matchedAmenities.slice(0, 2).join(", ")}`);
  }

  if (hotel.avgRating >= 4) {
    reasons.push(`Highly rated (${hotel.avgRating.toFixed(1)}★)`);
  }

  return reasons.join(" • ") || "Recommended for you";
};

// 🔥 2. Popular Hotels (Trending)
export const getPopularHotels = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Hotels with most bookings in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const popularHotels = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ["booked", "completed"] },
        },
      },
      {
        $group: {
          _id: "$hotelId",
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: "hotels",
          localField: "_id",
          foreignField: "_id",
          as: "hotel",
        },
      },
      { $unwind: "$hotel" },
      {
        $match: {
          "hotel.isActive": true,
          "hotel.isApproved": true,
        },
      },
      {
        $project: {
          _id: "$hotel._id",
          name: "$hotel.name",
          city: "$hotel.city",
          basePrice: "$hotel.basePrice",
          images: "$hotel.images",
          amenities: "$hotel.amenities",
          avgRating: "$hotel.avgRating",
          totalReviews: "$hotel.totalReviews",
          bookingCount: 1,
          popularityScore: {
            $multiply: ["$bookingCount", { $ifNull: ["$hotel.avgRating", 1] }],
          },
        },
      },
      { $sort: { popularityScore: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Popular hotels fetched",
      count: popularHotels.length,
      hotels: popularHotels,
    });
  } catch (error) {
    console.error("Popular hotels error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ⭐ 3. Top Rated Hotels
export const getTopRatedHotels = async (req, res) => {
  try {
    const { city, minRating = 4, limit = 10 } = req.query;

    const query = {
      isActive: true,
      isApproved: true,
      avgRating: { $gte: Number(minRating) },
      totalReviews: { $gte: 5 }, // At least 5 reviews
    };

    if (city) {
      query.city = { $regex: city, $options: "i" };
    }

    const topRatedHotels = await Hotel.find(query)
      .sort({ avgRating: -1, totalReviews: -1 })
      .limit(Number(limit))
      .select("-__v");

    return res.status(200).json({
      success: true,
      message: "Top rated hotels fetched",
      count: topRatedHotels.length,
      hotels: topRatedHotels,
    });
  } catch (error) {
    console.error("Top rated hotels error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 💰 4. Best Value Hotels (Price vs Rating)
export const getBestValueHotels = async (req, res) => {
  try {
    const { city, maxPrice, limit = 10 } = req.query;

    const query = {
      isActive: true,
      isApproved: true,
      avgRating: { $gte: 3.5 },
    };

    if (city) {
      query.city = { $regex: city, $options: "i" };
    }

    if (maxPrice) {
      query.basePrice = { $lte: Number(maxPrice) };
    }

    const hotels = await Hotel.find(query).select("-__v");

    // Calculate value score (rating / price)
    const valueHotels = hotels
      .map((hotel) => ({
        ...hotel.toObject(),
        valueScore: ((hotel.avgRating || 0) / hotel.basePrice) * 1000,
      }))
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, Number(limit));

    return res.status(200).json({
      success: true,
      message: "Best value hotels fetched",
      count: valueHotels.length,
      hotels: valueHotels,
    });
  } catch (error) {
    console.error("Best value hotels error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🏨 5. Similar Hotels (Collaborative Filtering)
export const getSimilarHotels = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { limit = 5 } = req.query;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID is required",
      });
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Find similar hotels based on:
    // 1. Same city
    // 2. Similar price range (±30%)
    // 3. Common amenities
    const similarHotels = await Hotel.find({
      _id: { $ne: hotelId },
      isActive: true,
      isApproved: true,
      city: hotel.city,
      basePrice: {
        $gte: hotel.basePrice * 0.7,
        $lte: hotel.basePrice * 1.3,
      },
      amenities: { $in: hotel.amenities },
    })
      .limit(Number(limit) * 2) // Get more to score
      .select("-__v");

    // Calculate similarity score
    const scoredHotels = similarHotels
      .map((similar) => {
        let score = 0;

        // Price similarity
        const priceDiff = Math.abs(similar.basePrice - hotel.basePrice);
        score += Math.max(0, 30 - priceDiff / 100);

        // Amenities overlap
        const commonAmenities = similar.amenities.filter((a) =>
          hotel.amenities.includes(a)
        );
        score += commonAmenities.length * 10;

        // Rating similarity
        const ratingDiff = Math.abs(
          (similar.avgRating || 0) - (hotel.avgRating || 0)
        );
        score += Math.max(0, 20 - ratingDiff * 5);

        return {
          ...similar.toObject(),
          similarityScore: Math.round(score),
          commonAmenities: commonAmenities.length,
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, Number(limit));

    return res.status(200).json({
      success: true,
      message: "Similar hotels fetched",
      count: scoredHotels.length,
      baseHotel: {
        id: hotel._id,
        name: hotel.name,
        city: hotel.city,
        basePrice: hotel.basePrice,
      },
      hotels: scoredHotels,
    });
  } catch (error) {
    console.error("Similar hotels error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🆕 6. New Hotels (Recently Added)
export const getNewHotels = async (req, res) => {
  try {
    const { limit = 10, city } = req.query;

    const query = {
      isActive: true,
      isApproved: true,
    };

    if (city) {
      query.city = { $regex: city, $options: "i" };
    }

    const newHotels = await Hotel.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select("-__v");

    return res.status(200).json({
      success: true,
      message: "New hotels fetched",
      count: newHotels.length,
      hotels: newHotels,
    });
  } catch (error) {
    console.error("New hotels error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 📍 7. Nearby Recommended Hotels (Based on User Location)
export const getNearbyRecommendations = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000, limit = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const nearbyHotels = await Hotel.find({
      isActive: true,
      isApproved: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: Number(maxDistance), // meters
        },
      },
    })
      .limit(Number(limit))
      .select("-__v");

    return res.status(200).json({
      success: true,
      message: "Nearby hotels fetched",
      count: nearbyHotels.length,
      searchRadius: `${maxDistance / 1000}km`,
      hotels: nearbyHotels,
    });
  } catch (error) {
    console.error("Nearby recommendations error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 💡 8. Smart Search with Recommendations
export const getSmartSearchRecommendations = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      checkIn,
      checkOut,
      guests,
      city,
      minPrice,
      maxPrice,
      amenities,
      limit = 20,
    } = req.query;

    // Base query
    const query = {
      isActive: true,
      isApproved: true,
    };

    if (city) query.city = { $regex: city, $options: "i" };
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }
    if (amenities) {
      const amenityList = amenities.split(",");
      query.amenities = { $all: amenityList };
    }

    let hotels = await Hotel.find(query).limit(Number(limit) * 2);

    // If dates provided, filter by availability
    if (checkIn && checkOut && guests) {
      const availableHotels = [];

      for (const hotel of hotels) {
        const rooms = await Room.find({ hotelId: hotel._id });

        for (const room of rooms) {
          const bookedCount = await Booking.countDocuments({
            roomId: room._id,
            status: "booked",
            checkIn: { $lt: new Date(checkOut) },
            checkOut: { $gt: new Date(checkIn) },
          });

          if (
            bookedCount < room.totalRooms &&
            room.maxGuests >= Number(guests)
          ) {
            availableHotels.push({
              ...hotel.toObject(),
              availableRoom: room,
            });
            break; // One room is enough
          }
        }
      }

      hotels = availableHotels;
    }

    // Get user preferences if logged in
    let userScore = {};
    if (userId) {
      const userBookings = await Booking.find({ userId })
        .populate("hotelId")
        .limit(5);

      const preferredCities = userBookings
        .map((b) => b.hotelId?.city)
        .filter(Boolean);
      const preferredAmenities = userBookings
        .flatMap((b) => b.hotelId?.amenities || [])
        .filter(Boolean);

      userScore = { preferredCities, preferredAmenities };
    }

    // Score and rank hotels
    const rankedHotels = hotels
      .map((hotel) => {
        let score = 0;

        // User preference bonus
        if (userScore.preferredCities?.includes(hotel.city)) score += 20;
        if (
          hotel.amenities?.some((a) =>
            userScore.preferredAmenities?.includes(a)
          )
        ) {
          score += 15;
        }

        // Rating bonus
        score += (hotel.avgRating || 0) * 10;

        // Review count bonus
        score += Math.min(hotel.totalReviews || 0, 50);

        return { ...hotel.toObject?.() || hotel, recommendationScore: score };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, Number(limit));

    return res.status(200).json({
      success: true,
      message: "Smart search results",
      count: rankedHotels.length,
      hotels: rankedHotels,
      filters: { city, minPrice, maxPrice, amenities, checkIn, checkOut, guests },
    });
  } catch (error) {
    console.error("Smart search error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🎁 9. Special Offers & Deals
export const getSpecialOffers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Hotels with low occupancy (discount opportunities)
    const hotels = await Hotel.find({
      isActive: true,
      isApproved: true,
    }).limit(Number(limit) * 2);

    const offersPromises = hotels.map(async (hotel) => {
      const rooms = await Room.find({ hotelId: hotel._id });

      let totalCapacity = 0;
      let bookedRooms = 0;

      for (const room of rooms) {
        totalCapacity += room.totalRooms;

        const booked = await Booking.countDocuments({
          roomId: room._id,
          status: "booked",
          checkIn: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        });

        bookedRooms += booked;
      }

      const occupancyRate = totalCapacity > 0 ? bookedRooms / totalCapacity : 0;

      // Low occupancy = better deals
      let discountPercent = 0;
      if (occupancyRate < 0.3) discountPercent = 30;
      else if (occupancyRate < 0.5) discountPercent = 20;
      else if (occupancyRate < 0.7) discountPercent = 10;

      if (discountPercent > 0) {
        return {
          ...hotel.toObject(),
          offer: {
            discountPercent,
            originalPrice: hotel.basePrice,
            offerPrice: Math.round(
              hotel.basePrice * (1 - discountPercent / 100)
            ),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        };
      }
      return null;
    });

    const offersResults = await Promise.all(offersPromises);
    const specialOffers = offersResults
      .filter((offer) => offer !== null)
      .slice(0, Number(limit));

    return res.status(200).json({
      success: true,
      message: "Special offers fetched",
      count: specialOffers.length,
      offers: specialOffers,
    });
  } catch (error) {
    console.error("Special offers error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔄 10. "Users Also Viewed" (Session-based)
export const getUsersAlsoViewed = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { limit = 5 } = req.query;

    // Get users who viewed this hotel
    const usersWhoViewed = await Booking.find({ hotelId })
      .distinct("userId")
      .limit(100);

    // Get other hotels these users viewed
    const otherHotels = await Booking.aggregate([
      {
        $match: {
          userId: { $in: usersWhoViewed },
          hotelId: { $ne: hotelId },
        },
      },
      { $group: { _id: "$hotelId", viewCount: { $sum: 1 } } },
      { $sort: { viewCount: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: "hotels",
          localField: "_id",
          foreignField: "_id",
          as: "hotel",
        },
      },
      { $unwind: "$hotel" },
      {
        $match: {
          "hotel.isActive": true,
          "hotel.isApproved": true,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Users also viewed",
      count: otherHotels.length,
      hotels: otherHotels.map((h) => ({ ...h.hotel, viewCount: h.viewCount })),
    });
  } catch (error) {
    console.error("Users also viewed error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};