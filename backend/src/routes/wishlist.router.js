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

/**
 * =========================
 * WISHLIST ROUTES
 * =========================
 */

/**
 * Add hotel + room to wishlist
 */
wishlistRouter.post(
  "/add/:hotelId/:roomId",
  protect,
  addToWishlist
);

/**
 * Add hotel only to wishlist (no room)
 */
wishlistRouter.post(
  "/add/:hotelId",
  protect,
  addToWishlist
);

/**
 * Remove wishlist item
 */
wishlistRouter.delete(
  "/:wishlistId",
  protect,
  removeFromWishlist
);

/**
 * Get user wishlist
 */
wishlistRouter.get(
  "/",
  protect,
  getUserWishlist
);

/**
 * Toggle wishlist
 */
wishlistRouter.post(
  "/toggle/:roomId",
  protect,
  toggleWishlist
);

/**
 * Check wishlisted
 */
wishlistRouter.get(
  "/check/:roomId",
  protect,
  isWishlisted
);

/**
 * Wishlist count
 */
wishlistRouter.get(
  "/count",
  protect,
  getWishlistCount
);

export default wishlistRouter;
