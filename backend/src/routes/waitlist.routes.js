import express from 'express'
import {
  addToWaitlist,
  getUserWaitlist,
  getRoomWaitlist,
  promoteWaitlistBooking,
  removeFromWaitlist,
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

waitlistRouter.delete(
  "/:waitlistId",
  protect,
  removeFromWaitlist
);



export default waitlistRouter