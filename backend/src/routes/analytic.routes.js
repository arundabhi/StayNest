
import express from "express";
import {
  getDashboardOverview,
  getRevenueChart,
  getBookingStatusDistribution,
  getRoomPerformance,
  getDailyBookingsTrend,
  getReviewAnalytics,
  getPaymentAnalytics,
  getGuestAnalytics,
} from "../controllers/analytic.controllers.js";
import { protect } from "../middelwares/auth.js";
import { authorizeRoles } from "../middelwares/role.js";

const analyticRouter = express.Router();

// All analytics routes require authentication and owner role
analyticRouter.use(protect, authorizeRoles('owner'));

// 📊 Dashboard Overview
analyticRouter.get("/dashboard/overview", getDashboardOverview);

// 📈 Revenue Charts
analyticRouter.get("/revenue/chart", getRevenueChart);

// 📊 Booking Analytics
analyticRouter.get("/bookings/distribution", getBookingStatusDistribution);
analyticRouter.get("/bookings/daily-trend", getDailyBookingsTrend);

// 🏨 Room Analytics
analyticRouter.get("/rooms/performance", getRoomPerformance);

// ⭐ Review Analytics
analyticRouter.get("/reviews", getReviewAnalytics);

// 💰 Payment Analytics
analyticRouter.get("/payments", getPaymentAnalytics);

// 👥 Guest Analytics
analyticRouter.get("/guests", getGuestAnalytics);

export default analyticRouter;


