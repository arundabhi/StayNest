import express from "express";
import {
  getRoomAvailabilityCalendar,
  getHotelAvailabilityCalendar,
  getMonthViewCalendar
} from "../controllers/availability.controllers.js";

const availabilityRouter = express.Router();


availabilityRouter.get("/room/:roomId/calendar", getRoomAvailabilityCalendar);


availabilityRouter.get("/hotel/:hotelId/calendar", getHotelAvailabilityCalendar);


availabilityRouter.get("/month-view", getMonthViewCalendar);


// availabilityRouter.get("/room/:roomId/check", quickAvailabilityCheck);


// availabilityRouter.get("/date-bookings", getDateBookingDetails);


// availabilityRouter.get("/hotel/:hotelId/forecast", getAvailabilityForecast);

export default availabilityRouter;