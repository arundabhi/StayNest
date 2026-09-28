import express from "express";
import {
  chatWithAI,
  chatStreamWithAI,
  getAIMetrics,
  resetState,
} from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.js";
import { conversationStateMiddleware } from "../ai/state/conversationState.middleware.js";

const router = express.Router();

// Standard Chat Endpoint
router.post("/chat", protect, conversationStateMiddleware, chatWithAI);

// Real-Time SSE Streaming Endpoint
router.post("/chat/stream", protect, conversationStateMiddleware, chatStreamWithAI);

// Reset / Clear Conversation State
router.post("/state/reset", protect, resetState);

// Observability & AI Performance Metrics (Admin/Owner)
router.get("/analytics/metrics", protect, getAIMetrics);

export default router;
