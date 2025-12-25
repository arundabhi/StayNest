import express from "express";
import {
  createBooking,
  cancelBooking,
  getMyBooking,
  getAllBookings,
  getAllBookingsForHotel,
  checkRoomAvailability,
  updatePaymentStatus,
  getPastBooking,
  getUpcomingBooking,
  getBookingStats,
  getHotelRevenue,
  getMonthlyHotelRevenue,
  confirmBooking,
  verifyPayment
} from "../controllers/booking.controllers.js";
import { protect } from "../middelwares/auth.js";
import { authorizeRoles } from "../middelwares/role.js";

const bookingRouter = express.Router();

// user
bookingRouter.post("/:hotelId/:roomId",protect,createBooking);
bookingRouter.patch('/confirm/:bookingId',protect,confirmBooking)
bookingRouter.patch("/cancel/:bookingId",protect, cancelBooking);
bookingRouter.get("/my/:bookingId",protect, getMyBooking);
bookingRouter.get("/my",protect, getAllBookings);
bookingRouter.get("/past",protect, getPastBooking);
bookingRouter.get("/upcoming",protect, getUpcomingBooking);
bookingRouter.get("/stats",protect, getBookingStats);

// availability
bookingRouter.get(
  "/availability/:hotelId/:roomId",
  protect,
  checkRoomAvailability
);



// payment (should be protected / webhook ideally)
bookingRouter.patch("/payment/:bookingId", updatePaymentStatus);
bookingRouter.patch(
  "/payment/verify/:bookingId",
  protect,
  verifyPayment
);

// owner / admin
bookingRouter.get("/hotel/:hotelId",protect,
  authorizeRoles("owner", "admin"), getAllBookingsForHotel);
bookingRouter.get("/hotel/:hotelId/revenue",protect,
  authorizeRoles("owner", "admin"), getHotelRevenue);
bookingRouter.get("/hotel/:hotelId/revenue/monthly",protect,
  authorizeRoles("owner", "admin"), getMonthlyHotelRevenue);

export default bookingRouter;
