import express from "express";
import {
  registerHotel,
  updateHotel,
  deleteHotel,
  getHotelById,
  searchHotel,
  getMyHotel,
  toggleHotelState,
  getAllHotels,
  getNearbyHotels,
  addHotelImages,
  removeHotelImage,
  getHotelStats,
} from "../controllers/hotel.controllers.js";

import { protect } from "../middelwares/auth.js";
import { authorizeRoles } from "../middelwares/role.js";
import upload from "../middelwares/multer.js";

const hotelRouter = express.Router();

hotelRouter.get("/", getAllHotels);


hotelRouter.get("/search", searchHotel);

hotelRouter.get("/nearby", getNearbyHotels);

hotelRouter.get("/:hotelId", getHotelById);

hotelRouter.post(
  "/",
  protect,
  upload.array("images", 5),
  registerHotel
);


hotelRouter.get(
  "/my/hotels",
  protect,
  authorizeRoles("owner", "admin"),
  getMyHotel
);


hotelRouter.patch(
  "/:hotelId",
  protect,
  authorizeRoles("owner", "admin"),
  upload.array("images", 5),
  updateHotel
);


hotelRouter.patch(
  "/toggle/status",
  protect,
  authorizeRoles("owner", "admin"),
  toggleHotelState
);


hotelRouter.patch(
  "/images/add",
  protect,
  authorizeRoles("owner", "admin"),
  upload.array("images", 5),
  addHotelImages
);


hotelRouter.delete(
  "/images/remove",
  protect,
  authorizeRoles("owner", "admin"),
  removeHotelImage
);


hotelRouter.delete(
  "/:hotelId",
  protect,
  authorizeRoles("owner", "admin"),
  deleteHotel
);


hotelRouter.get(
  "/stats/dashboard",
  protect,
  authorizeRoles("owner", "admin"),
  getHotelStats
);

export default hotelRouter;
