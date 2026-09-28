import { conversationStateService } from "./conversationState.service.js";

/**
 * Middleware that loads conversation state before AI execution
 * and attaches state persistence to the request lifecycle.
 */
export const conversationStateMiddleware = async (req, res, next) => {
  try {
    const userId = req.userId?.toString() || req.user?._id?.toString();
    // Use header, body, or fallback to userId as sessionId
    const sessionId =
      req.headers["x-session-id"] ||
      req.body?.sessionId ||
      (userId ? `user_session_${userId}` : `guest_session_${Date.now()}`);

    req.sessionId = sessionId;

    // Load structured state (from Cache or MongoDB)
    const state = await conversationStateService.getState(sessionId, userId);
    req.conversationState = state;

    // Hook into res.send/res.json to automatically persist state after AI completes
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (req.conversationState) {
        // Asynchronously persist state updates
        conversationStateService
          .saveState(req.sessionId, req.conversationState)
          .catch((err) => {
            console.error("[STATE MIDDLEWARE] Error auto-saving state:", err);
          });
      }
      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error("[STATE MIDDLEWARE] Failed to load conversation state:", error);
    // Continue with default fallback state rather than breaking the request
    req.sessionId = req.sessionId || `session_${Date.now()}`;
    req.conversationState = conversationStateService.getDefaultState(
      req.sessionId,
      req.userId
    );
    next();
  }
};
