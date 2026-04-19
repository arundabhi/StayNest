
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
import { protect } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";

const analyticRouter = express.Router();


analyticRouter.use(protect, authorizeRoles('owner'));

analyticRouter.get("/dashboard/overview", getDashboardOverview);


analyticRouter.get("/revenue/chart", getRevenueChart);


analyticRouter.get("/bookings/distribution", getBookingStatusDistribution);
analyticRouter.get("/bookings/daily-trend", getDailyBookingsTrend);

analyticRouter.get("/rooms/performance", getRoomPerformance);


analyticRouter.get("/reviews", getReviewAnalytics);

analyticRouter.get("/payments", getPaymentAnalytics);

analyticRouter.get("/guests", getGuestAnalytics);

export default analyticRouter;


