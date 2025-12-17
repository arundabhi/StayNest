import express from "express";
import { registerHotel } from "../controllers/hotel.controllers.js";
import { protect } from "../middelwares/auth.js";
import { isOwner } from "../middelwares/role.js";
import upload from "../middelwares/multer.js";

const hotelRouter = express.Router();

hotelRouter.post(
  "/register",
  protect,
  isOwner,
  upload.array("images", 5),
  registerHotel
);

export default hotelRouter;
