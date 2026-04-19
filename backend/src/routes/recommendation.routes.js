
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
  getHotelOffer,
} from "../controllers/recommendation.controllers.js";
import { protect } from "../middlewares/auth.js";

const recommendationRoutes = express.Router();


recommendationRoutes.get("/personalized", protect, getPersonalizedRecommendations);


recommendationRoutes.get("/popular", getPopularHotels);


recommendationRoutes.get("/top-rated", getTopRatedHotels);

recommendationRoutes.get("/best-value", getBestValueHotels);


recommendationRoutes.get("/similar/:hotelId", getSimilarHotels);

recommendationRoutes.get("/new", getNewHotels);

recommendationRoutes.get("/nearby", getNearbyRecommendations);

recommendationRoutes.get("/smart-search", getSmartSearchRecommendations);

recommendationRoutes.get("/offers", getSpecialOffers);

recommendationRoutes.get("/also-viewed/:hotelId", getUsersAlsoViewed);
recommendationRoutes.get("/offer/:hotelId", getHotelOffer);

export default recommendationRoutes;