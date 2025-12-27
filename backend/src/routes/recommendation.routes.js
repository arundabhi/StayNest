
import express from "express";
import {
  getPersonalizedRecommendations,
  getPopularHotels,
  getTopRatedHotels,
  getBestValueHotels,
  getSimilarHotels,
  getNewHotels,
  getNearbyRecommendations,
  getSmartSearchRecommendations,
  getSpecialOffers,
  getUsersAlsoViewed,
} from "../controllers/recommendation.controllers.js";
import { protect } from "../middelwares/auth.js";

const recommendationRoutes = express.Router();

// 🎯 Personalized (requires login)
recommendationRoutes.get("/personalized", protect, getPersonalizedRecommendations);

// 🔥 Popular & Trending
recommendationRoutes.get("/popular", getPopularHotels);

// ⭐ Top Rated
recommendationRoutes.get("/top-rated", getTopRatedHotels);

// 💰 Best Value
recommendationRoutes.get("/best-value", getBestValueHotels);

// 🏨 Similar Hotels
recommendationRoutes.get("/similar/:hotelId", getSimilarHotels);

// 🆕 New Hotels
recommendationRoutes.get("/new", getNewHotels);

// 📍 Nearby (location-based)
recommendationRoutes.get("/nearby", getNearbyRecommendations);

// 💡 Smart Search
recommendationRoutes.get("/smart-search", getSmartSearchRecommendations);

// 🎁 Special Offers
recommendationRoutes.get("/offers", getSpecialOffers);

// 🔄 Users Also Viewed
recommendationRoutes.get("/also-viewed/:hotelId", getUsersAlsoViewed);

export default recommendationRoutes;