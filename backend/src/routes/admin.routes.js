import express from "express";
import { adminLogin, approveHotel, createOwner, getAllOwners } from "../controllers/admin.controllers.js";
import { isAdmin } from "../middelwares/admin.js";
import { protect } from "../middelwares/auth.js";
import { getAllHotels } from "../controllers/hotel.controllers.js";

const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);
adminRouter.post("/create-owner", isAdmin, createOwner);
adminRouter.get("/get-all-owner",isAdmin,getAllOwners)
adminRouter.put("/hotels/:hotelId/approve", isAdmin, approveHotel);
adminRouter.get(
  "/hotels",
  protect,
  isAdmin,
  getAllHotels
);

export default adminRouter;
