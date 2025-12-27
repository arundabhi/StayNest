import express from "express";
import {
  getRoomAvailabilityCalendar,
  getHotelAvailabilityCalendar,
  getMonthViewCalendar,
  quickAvailabilityCheck,
  getDateBookingDetails,
  getAvailabilityForecast,
} from "../controllers/availability.controllers.js";

const availabilityRouter = express.Router();

// 📅 Room Availability Calendar (Date Range)
availabilityRouter.get("/room/:roomId/calendar", getRoomAvailabilityCalendar);

// 🏨 Hotel Availability Calendar (All Rooms)
availabilityRouter.get("/hotel/:hotelId/calendar", getHotelAvailabilityCalendar);

// 📊 Month View Calendar
availabilityRouter.get("/month-view", getMonthViewCalendar);

// ⚡ Quick Availability Check
availabilityRouter.get("/room/:roomId/check", quickAvailabilityCheck);

// 🔔 Date Booking Details
availabilityRouter.get("/date-bookings", getDateBookingDetails);

// 📈 Availability Forecast (Next 30 Days)
availabilityRouter.get("/hotel/:hotelId/forecast", getAvailabilityForecast);

export default availabilityRouter;