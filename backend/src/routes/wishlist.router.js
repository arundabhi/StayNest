import express from "express";
import {
  toggleWishlist,
  isWishlisted,
  getUserWishlist,
  removeFromWishlist,
  getWishlistCount,
} from "../controllers/wishlist.controllers.js";
import { protect } from "../middelwares/auth.js";

const wishlistRouter = express.Router();

/**
 * ❤️ Toggle wishlist (HOTEL-level, room optional)
 * BODY: { hotelId } OR { roomId }
 */
wishlistRouter.post(
  "/toggle",
  protect,
  toggleWishlist
);

/**
 * ❤️ Check if hotel is wishlisted
 */
wishlistRouter.get(
  "/is-wishlisted/:hotelId",
  protect,
  isWishlisted
);

/**
 * 📄 Get user wishlist
 */
wishlistRouter.get(
  "/",
  protect,
  getUserWishlist
);

/**
 * ❌ Remove wishlist item
 */
wishlistRouter.delete(
  "/:wishlistId",
  protect,
  removeFromWishlist
);

/**
 * 🔢 Wishlist count (navbar badge)
 */
wishlistRouter.get(
  "/count",
  protect,
  getWishlistCount
);

export default wishlistRouter;
