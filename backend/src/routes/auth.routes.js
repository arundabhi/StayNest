import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword
} from "../controllers/auth.controllers.js";

import { protect } from "../middelwares/auth.js";
import upload from "../middelwares/multer.js";

const authRouter = express.Router();

// Auth routes
authRouter.post("/register", upload.single("profileImage"), registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/logout", protect, logoutUser);
authRouter.post("/refresh-token", refreshAccessToken);

// Password reset
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password/:token", resetPassword);

export default authRouter;
