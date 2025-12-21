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

import { protect } from "../middelwares/auth.js";
import upload from "../middelwares/multer.js";

const authRouter = express.Router();

authRouter.post("/register", upload.single("profileImage"), registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/logout", protect, logoutUser);
authRouter.post("/refresh-token", refreshAccessToken);
authRouter.post("/owner/login", ownerLogin);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password/:token", resetPassword);

export default authRouter;
