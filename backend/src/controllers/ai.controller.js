import { agentRouter } from "../ai/router/agentRouter.js";
import { conversationStateService } from "../ai/state/conversationState.service.js";
import { observabilityService } from "../ai/analytics/observability.service.js";
import { SSEStreamHandler } from "../ai/streaming/sseStream.js";
import mongoose from "mongoose";

/**
 * Standard JSON POST /api/v1/ai/chat
 */
export const chatWithAI = async (req, res) => {
  try {
    const { message, sessionId: bodySessionId } = req.body;
    const userId = req.userId?.toString() || req.user?._id?.toString() || "guest_user";
    const sessionId =
      req.headers["x-session-id"] ||
      bodySessionId ||
      req.sessionId ||
      `user_session_${userId}`;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required and must be a non-empty string.",
      });
    }

    const trimmed = message.trim();

    // 1. Direct Clear / Reset chat bypass
    if (
      trimmed.toLowerCase() === "clear chat" ||
      trimmed.toLowerCase() === "reset chat" ||
      trimmed.toLowerCase() === "start over"
    ) {
      await conversationStateService.resetState(sessionId, userId);

      const db = mongoose.connection.db;
      if (db) {
        await db.collection("chat_history").deleteMany({
          $or: [{ sessionId }, { sessionId: userId }],
        });
      }

      return res.status(200).json({
        success: true,
        response: "🔄 Conversation history and booking state have been reset. How may I assist you now?",
        intent: "GENERAL_CONVERSATION",
        resolvedBy: "manual_reset",
      });
    }

    // 2. Dispatch through Master Agent Router
    const userRole = req.user?.role || "user";
    const result = await agentRouter.dispatch({
      userId,
      sessionId,
      message: trimmed,
      userRole,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[AI CONTROLLER] Request error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal error occurred while processing your request.",
      error: error.message,
    });
  }
};

/**
 * Real-Time Streaming SSE POST /api/v1/ai/chat/stream
 */
export const chatStreamWithAI = async (req, res) => {
  try {
    const { message, sessionId: bodySessionId } = req.body;
    const userId = req.userId?.toString() || req.user?._id?.toString() || "guest_user";
    const sessionId =
      req.headers["x-session-id"] ||
      bodySessionId ||
      `user_session_${userId}`;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    // Initialize SSE headers
    SSEStreamHandler.initSSE(res);

    SSEStreamHandler.sendEvent(res, "status", { message: "Analyzing query..." });

    const userRole = req.user?.role || "user";

    const result = await agentRouter.dispatch({
      userId,
      sessionId,
      message: message.trim(),
      userRole,
      onStreamEvent: (event) => {
        SSEStreamHandler.sendEvent(res, event.type, { message: event.data });
      },
    });

    // Stream the final response text in chunks or whole
    SSEStreamHandler.sendEvent(res, "token", { text: result.response });

    if (result.paymentUrl) {
      SSEStreamHandler.sendEvent(res, "action", {
        type: "REDIRECT_TO_PAYMENT",
        url: result.paymentUrl,
        bookingId: result.bookingId,
      });
    }

    SSEStreamHandler.sendEvent(res, "done", {
      intent: result.intent,
      resolvedBy: result.resolvedBy,
      latencyMs: result.latencyMs,
    });

    res.end();
  } catch (error) {
    console.error("[AI CONTROLLER STREAM] Stream error:", error);
    SSEStreamHandler.sendEvent(res, "error", { message: error.message });
    res.end();
  }
};

/**
 * Admin Observability Metrics GET /api/v1/ai/analytics
 */
export const getAIMetrics = async (req, res) => {
  try {
    const days = parseInt(req.query.days || "7", 10);
    const metrics = await observabilityService.getDashboardMetrics(days);
    return res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Reset State Endpoint POST /api/v1/ai/state/reset
 */
export const resetState = async (req, res) => {
  try {
    const userId = req.userId?.toString() || req.user?._id?.toString();
    const sessionId = req.headers["x-session-id"] || req.body.sessionId || `user_session_${userId}`;
    await conversationStateService.resetState(sessionId, userId);

    return res.status(200).json({
      success: true,
      message: "State has been cleared successfully.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};