import express from "express";

import {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  toggleWishlist,
  isWishlisted,
  getWishlistCount,
} from "../controllers/wishlist.controllers.js";

import { protect } from "../middelwares/auth.js";


const wishlistRouter = express.Router();

wishlistRouter.post(
  "/add/:hotelId/:roomId?",
  protect,
  addToWishlist
);

wishlistRouter.delete(
  "/:wishlistId",
  protect,
  removeFromWishlist
);


wishlistRouter.get(
  "/",
  protect,
  getUserWishlist
);

wishlistRouter.post(
  "/toggle/:roomId",
  protect,
  toggleWishlist
);


wishlistRouter.get(
  "/check/:roomId",
  protect,
  isWishlisted
);

wishlistRouter.get(
  "/count",
  protect,
  getWishlistCount
);

export default wishlistRouter;
