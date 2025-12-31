import express from "express";
import { adminLogin, approveHotel, createOwner, getAllOwners, getRegisteredHotels } from "../controllers/admin.controllers.js";
import { isAdmin } from "../middelwares/admin.js";
import { protect } from "../middelwares/auth.js";
import { getAllHotels } from "../controllers/hotel.controllers.js";

const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);
adminRouter.post("/create-owner", protect,isAdmin, createOwner);
adminRouter.get("/get-all-owner",protect,isAdmin,getAllOwners)
adminRouter.put("/hotels/:hotelId/approve", protect,isAdmin, approveHotel);
adminRouter.get(
  "/hotels",
  protect,
  isAdmin,
  getAllHotels
);
adminRouter.get(
  "/register-hotels",
  protect,
  isAdmin,
  getRegisteredHotels
);


export default adminRouter;
