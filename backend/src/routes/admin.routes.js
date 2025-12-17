import express from "express";
import { adminLogin, createOwner } from "../controllers/admin.controllers.js";
import { isAdmin } from "../middelwares/admin.js";

const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);
adminRouter.post("/create-owner", isAdmin, createOwner);

export default adminRouter;
