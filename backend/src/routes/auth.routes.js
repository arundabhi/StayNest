import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  ownerLogin
} from "../controllers/auth.controllers.js";

import { protect } from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import { authLimiter, emailLimiter } from "../middlewares/rateLimiter.js";

const authRouter = express.Router();

authRouter.post("/register", upload.single("profileImage"), registerUser);
authRouter.post("/login",authLimiter, loginUser);
authRouter.post("/logout", protect, logoutUser);
authRouter.post("/refresh-token", refreshAccessToken);
authRouter.post("/owner/login", ownerLogin);
authRouter.post("/forgot-password",emailLimiter, forgotPassword);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
