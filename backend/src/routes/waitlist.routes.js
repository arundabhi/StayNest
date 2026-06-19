import express from 'express'
import {
  addToWaitlist,
  getUserWaitlist,
  getRoomWaitlist,
  promoteWaitlistBooking,
  removeFromWaitlist,
  getHotelWaitlist,
  promoteSpecificWaitlist,
} from "../controllers/waitlist.controllers.js";
import { protect } from "../middlewares/auth.js";
import { authorizeRoles } from '../middlewares/role.js';


const waitlistRouter = express.Router();

waitlistRouter.post(
  "/:roomId",
  protect,
  addToWaitlist
);

waitlistRouter.get(
  "/user",
  protect,
  getUserWaitlist
);

waitlistRouter.get(
  "/room/:roomId",
  protect,
  authorizeRoles("owner", "admin"),
  getRoomWaitlist
);

waitlistRouter.patch(
  "/promote/:roomId",
  protect,
  authorizeRoles("owner", "admin"),
  promoteWaitlistBooking
);

waitlistRouter.get(
  "/hotel/:hotelId",
  protect,
  authorizeRoles("owner", "admin"),
  getHotelWaitlist
);

waitlistRouter.patch(
  "/promote-entry/:waitlistId",
  protect,
  authorizeRoles("owner", "admin"),
  promoteSpecificWaitlist
);

waitlistRouter.delete(
  "/:waitlistId",
  protect,
  removeFromWaitlist
);



export default waitlistRouter