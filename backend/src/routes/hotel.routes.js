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
} from "../controllers/hotel.controllers.js";

import { protect } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";
import upload from "../middlewares/multer.js";

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
  "/my/hotel",
  protect,
  authorizeRoles("owner", "admin"),
  getMyHotel
);


hotelRouter.patch(
  "/update",
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



export default hotelRouter;
