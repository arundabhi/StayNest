import express from "express";
import { adminLogin, approveHotel, createOwner, deleteOwner, getAllHotelsAdmin, getAllOwners, getRegisteredHotels } from "../controllers/admin.controllers.js";
import { isAdmin } from "../middelwares/admin.js";
import { protect } from "../middelwares/auth.js";


const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);
adminRouter.post("/create-owner", protect,isAdmin, createOwner);
adminRouter.get("/get-all-owner",protect,isAdmin,getAllOwners)
adminRouter.put("/hotels/:hotelId/approve", protect,isAdmin, approveHotel);
adminRouter.get(
  "/hotels",
  protect,
  isAdmin,
  getAllHotelsAdmin
);
adminRouter.get(
  "/register-hotels",
  protect,
  isAdmin,
  getRegisteredHotels
);
adminRouter.delete(
  "/owners/:ownerId",
  protect,
  isAdmin,
  deleteOwner
);


export default adminRouter;
