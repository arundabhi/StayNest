import express from "express";
import {
  createPricing,
  getHotelPricing,
  updatePricing,
  deletePricing,
  showDiscountToUser
} from "../controllers/pricing.controllers.js";

import { protect } from "../middelwares/auth.js";
import { authorizeRoles } from "../middelwares/role.js";

const pricingRouter = express.Router();

pricingRouter.post(
  "/:hotelId",
  protect,
  authorizeRoles("owner"),
  createPricing
);

pricingRouter.get(
  "/hotel/:hotelId",
  protect,
  authorizeRoles("owner"),
  getHotelPricing
);


pricingRouter.put(
  "/:pricingId",
  protect,
  authorizeRoles("owner"),
  updatePricing
);

pricingRouter.get(
  "/:hotelId",
  showDiscountToUser
);

pricingRouter.delete(
  "/:pricingId",
  protect,
  authorizeRoles("owner"),
  deletePricing
);

export default pricingRouter;