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
import { isOwner } from "../middelwares/role.js";
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
  isOwner,
  getMyHotel
);


hotelRouter.patch(
  "/:hotelId",
  protect,
  isOwner,
  upload.array("images", 5),
  updateHotel
);


hotelRouter.patch(
  "/toggle/status",
  protect,
  isOwner,
  toggleHotelState
);


hotelRouter.patch(
  "/images/add",
  protect,
  isOwner,
  upload.array("images", 5),
  addHotelImages
);


hotelRouter.delete(
  "/images/remove",
  protect,
  isOwner,
  removeHotelImage
);


hotelRouter.delete(
  "/:hotelId",
  protect,
  isOwner,
  deleteHotel
);


hotelRouter.get(
  "/stats/dashboard",
  protect,
  isOwner,
  getHotelStats
);

export default hotelRouter;
