import express from "express";
import { chatWithAI } from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/chat", protect, chatWithAI);

export default router;
