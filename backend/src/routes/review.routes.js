import express from "express";
import {
  addReview,
  deleteReview,
  getUserReview,
  getHotelReviews,
  getHotelRating
} from "../controllers/review.controllers.js";

import { protect } from "../middelwares/auth.js";


const reviewRouter = express.Router();


reviewRouter.post(
  "/:hotelId/:roomId",
  protect,
  addReview
);

reviewRouter.delete(
  "/:reviewId",
  protect,
  deleteReview
);

reviewRouter.get(
  "/user/me",
  protect,
  getUserReview
);


reviewRouter.get(
  "/hotel/:hotelId",
  getHotelReviews
);


reviewRouter.get(
  "/hotel/:hotelId/rating",
  getHotelRating
);

export default reviewRouter;
