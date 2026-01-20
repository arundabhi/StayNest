import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import './src/api/cron/cleanup.js'
import connectDb from "./src/db/index.js";


import userRouter from "./src/routes/user.routes.js";
import adminRouter from "./src/routes/admin.routes.js";
import authRouter from "./src/routes/auth.routes.js";
import hotelRouter from "./src/routes/hotel.routes.js";
import roomRouter from "./src/routes/room.routes.js";
import bookingRouter from "./src/routes/booking.routes.js";
import waitlistRouter from "./src/routes/waitlist.routes.js";
import wishlistRouter from "./src/routes/wishlist.router.js";
import reviewRouter from "./src/routes/review.routes.js";
import chatRouter from "./src/routes/chat.routes.js";
import paymentRouter from "./src/routes/payment.routes.js";
import couponRouter from "./src/routes/coupone.routes.js";
import recommendationRoutes from "./src/routes/recommendation.routes.js";
import analyticRouter from "./src/routes/analytic.routes.js";
import availabilityRouter from "./src/routes/availability.routes.js";
import { apiLimiter } from "./src/middelwares/rateLimiter.js";


dotenv.config({ path: "./.env" });

const app = express();
const port = process.env.PORT || 3000;

connectDb();

// ✅ CORRECT CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Security
app.use(helmet());
app.use(hpp());
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiter
app.use("/api/v1", apiLimiter);

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/hotels", hotelRouter);
app.use("/api/v1/rooms", roomRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/waitlists", waitlistRouter);
app.use("/api/v1/wishlists", wishlistRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/recommendations", recommendationRoutes);
app.use("/api/v1/analytics", analyticRouter);
app.use("/api/v1/availability", availabilityRouter);

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

