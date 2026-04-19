import express from "express";
import {
  getUser,
  updateUser,
  changePassword,
  deleteUser
} from "../controllers/user.controllers.js";

import { protect } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.get("/me", protect, getUser);
userRouter.put("/update", protect, updateUser);
userRouter.put("/change-password", protect, changePassword);
userRouter.delete("/delete", protect, deleteUser);

export default userRouter;
