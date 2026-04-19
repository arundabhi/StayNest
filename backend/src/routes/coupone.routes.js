import express from "express";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAllCoupon,
  getCouponById,
  toggleCouponState,
  validateCoupon,
  applyCoupon,
  getAvailableCoupons,
} from "../controllers/coupone.controllers.js";

import { protect } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";
import { isAdmin } from "../middlewares/admin.js";

const couponRouter = express.Router();
couponRouter.post(
  "/create",
  protect,
  isAdmin,
  createCoupon
);

couponRouter.put(
  "/:couponId",
  protect,
  authorizeRoles("owner", "admin"),
  updateCoupon
);

couponRouter.delete(
  "/:couponId",
  protect,
  authorizeRoles("owner", "admin"),
  deleteCoupon
);

couponRouter.patch(
  "/:couponId/toggle",
  protect,
  authorizeRoles("owner", "admin"),
  toggleCouponState
);

couponRouter.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllCoupon
);



couponRouter.get(
  "/available",
  protect,
  getAvailableCoupons
);

couponRouter.post(
  "/validate",
  protect,
  validateCoupon
);

couponRouter.post(
  "/apply/:bookingId",
  protect,
  applyCoupon
);


couponRouter.get(
  "/:couponId",
  protect,
  authorizeRoles("owner", "admin"),
  getCouponById
);
export default couponRouter;
