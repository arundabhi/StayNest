import express from "express";
import {
  toggleWishlist,
  isWishlisted,
  getUserWishlist,
  removeFromWishlist,
  getWishlistCount,
} from "../controllers/wishlist.controllers.js";
import { protect } from "../middlewares/auth.js";

const wishlistRouter = express.Router();


wishlistRouter.post(
  "/toggle",
  protect,
  toggleWishlist
);


wishlistRouter.get(
  "/is-wishlisted/:hotelId",
  protect,
  isWishlisted
);


wishlistRouter.get(
  "/",
  protect,
  getUserWishlist
);


wishlistRouter.delete(
  "/:wishlistId",
  protect,
  removeFromWishlist
);


wishlistRouter.get(
  "/count",
  protect,
  getWishlistCount
);

export default wishlistRouter;
