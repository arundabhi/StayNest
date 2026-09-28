import { conversationStateService } from "../state/conversationState.service.js";
import { intentRouter } from "./intentRouter.js";
import { entityResolver } from "../workflow/entityResolver.js";
import { workflowEngine } from "../workflow/workflowEngine.js";
import { conciergeAgent } from "../agent/conciergeAgent.js";
import { bookingAgent } from "../agent/bookingAgent.js";
import { supportAgent } from "../agent/supportAgent.js";
import { travelPlannerService } from "../travel-planner/travelPlanner.service.js";
import { comparisonAgent } from "../agent/comparisonAgent.js";
import { ownerAnalyticsAgent } from "../agent/ownerAnalyticsAgent.js";
import { userPreferenceService } from "../memory/userPreference.service.js";
import { observabilityService } from "../analytics/observability.service.js";
import { getMemory } from "../memory/chatMemory.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { performance } from "perf_hooks";

export class AgentRouter {
  /**
   * Master dispatch function
   */
  async dispatch({ userId, sessionId, message, userRole = "user", onStreamEvent = null }) {
    const startTime = performance.now();
    const trimmedMessage = message?.trim();

    if (!trimmedMessage) {
      return {
        success: false,
        response: "Please enter a message to get started.",
        intent: "GENERAL_CONVERSATION",
        resolvedBy: "empty_input_guard",
      };
    }

    // 1. Load structured conversation state
    const state = await conversationStateService.getState(sessionId, userId);

    // 2. Perform entity and reference resolution ("this hotel", "2", "option 1", "yes")
    const { resolvedEntities } = entityResolver.resolve(trimmedMessage, state);

    // 3. Classify intent
    const intent = intentRouter.classifyIntent(trimmedMessage, state, userRole);
    console.log(`[AGENT ROUTER] Session: ${sessionId} | Intent: ${intent} | Step: ${state.currentStep}`);

    // Asynchronously extract and update long-term user preferences
    userPreferenceService
      .extractAndUpdatePreferences(userId, trimmedMessage)
      .catch((err) => console.warn("[AGENT ROUTER] Pref extraction error:", err.message));

    // 4. Check deterministic booking interceptor / workflow engine
    if (intent === "BOOKING_WORKFLOW" || state.currentStep !== "IDLE") {
      if (onStreamEvent) onStreamEvent({ type: "status", data: "Processing booking workflow..." });

      const workflowResult = await workflowEngine.process(userId, trimmedMessage, state);
      if (workflowResult && (workflowResult.handled || workflowResult.intercepted)) {
        const latencyMs = performance.now() - startTime;

        observabilityService.logTransaction({
          sessionId,
          userId,
          query: trimmedMessage,
          intent: "BOOKING_WORKFLOW",
          agentUsed: "WorkflowEngine",
          resolvedBy: workflowResult.resolvedBy || "workflow_engine",
          latencyMs,
          success: true,
          stateSnapshot: {
            currentStep: state.currentStep,
            selectedHotelId: state.selectedHotel?.hotelId,
            selectedRoomId: state.selectedRoom?.roomId,
            pendingBookingStatus: state.pendingBooking?.status,
          },
        });

        return {
          success: true,
          response: workflowResult.response,
          intent: "BOOKING_WORKFLOW",
          resolvedBy: workflowResult.resolvedBy || "workflow_engine",
          bookingId: workflowResult.bookingId,
          paymentUrl: workflowResult.paymentUrl,
        };
      }
    }

    // 5. Load Chat History from MongoDB Memory
    let chatHistory = [];
    try {
      const memory = await getMemory(sessionId);
      const vars = await memory.loadMemoryVariables({});
      const raw = vars?.chat_history || vars?.history || [];
      chatHistory = (Array.isArray(raw) ? raw : []).slice(-10).map((m) => {
        if (m.lc_serializable) return m;
        const role = m.role || m.type || "";
        return role === "human" || role === "user"
          ? new HumanMessage(m.content || m.text || "")
          : new AIMessage(m.content || m.text || "");
      });
    } catch (memErr) {
      console.warn("[AGENT ROUTER] Memory loading warning:", memErr.message);
    }

    let response = "";
    let agentUsed = "ConciergeAgent";
    let resolvedBy = "agent";

    // 6. Route to specialized agent based on intent
    try {
      switch (intent) {
        case "TRAVEL_PLANNER": {
          agentUsed = "TravelPlannerService";
          resolvedBy = "travel_planner";
          if (onStreamEvent) onStreamEvent({ type: "status", data: "Generating curated travel itinerary..." });

          // Extract city from query or state
          const cityMatch = trimmedMessage.match(/\b(?:for|in|to)\s+([a-zA-Z\s]{3,20})\b/i);
          const city = cityMatch ? cityMatch[1].trim() : state.city || "Somnath";

          const daysMatch = trimmedMessage.match(/(\d+)\s*day/i);
          const days = daysMatch ? parseInt(daysMatch[1], 10) : 3;

          const prefs = await userPreferenceService.getPreferences(userId);
          response = await travelPlannerService.generateItinerary(city, days, prefs);
          break;
        }

        case "HOTEL_COMPARISON": {
          agentUsed = "ComparisonAgent";
          resolvedBy = "comparison_agent";
          if (onStreamEvent) onStreamEvent({ type: "status", data: "Analyzing hotel features side-by-side..." });

          // Extract candidate names from query
          const andMatch = trimmedMessage.match(/compare\s+(.+?)\s+(?:and|with|vs|to)\s+(.+)/i);
          const hotelA = andMatch ? andMatch[1] : null;
          const hotelB = andMatch ? andMatch[2] : null;

          response = await comparisonAgent.compareHotels(hotelA, hotelB, state.city);
          break;
        }

        case "OWNER_ANALYTICS": {
          agentUsed = "OwnerAnalyticsAgent";
          resolvedBy = "owner_analytics";
          if (onStreamEvent) onStreamEvent({ type: "status", data: "Aggregating revenue & occupancy metrics..." });

          response = await ownerAnalyticsAgent.analyze(userId, trimmedMessage, state.selectedHotel?.hotelId);
          break;
        }

        case "SUPPORT_POLICY": {
          agentUsed = "SupportAgent";
          resolvedBy = "support_rag";
          if (onStreamEvent) onStreamEvent({ type: "status", data: "Consulting StayNest knowledge base..." });

          response = await supportAgent.run({
            userId,
            message: trimmedMessage,
            chatHistory,
            state,
          });
          break;
        }

        case "BOOKING_WORKFLOW": {
          agentUsed = "BookingAgent";
          resolvedBy = "booking_agent";
          if (onStreamEvent) onStreamEvent({ type: "status", data: "Connecting to reservation engine..." });

          response = await bookingAgent.run({
            userId,
            sessionId,
            message: trimmedMessage,
            chatHistory,
            state,
          });
          break;
        }

        case "HOTEL_DISCOVERY":
        default: {
          agentUsed = "ConciergeAgent";
          resolvedBy = "concierge_agent";
          if (onStreamEvent) onStreamEvent({ type: "status", data: "Searching matched hotels..." });

          response = await conciergeAgent.run({
            userId,
            sessionId,
            message: trimmedMessage,
            chatHistory,
            state,
          });
          break;
        }
      }
    } catch (agentErr) {
      console.error(`[AGENT ROUTER] Error in ${agentUsed}:`, agentErr);
      response = "I encountered a momentary issue processing your request. Please try again.";
      resolvedBy = "error_fallback";
    }

    const latencyMs = performance.now() - startTime;

    // 7. Persist to Chat Memory (non-fatal)
    try {
      const memory = await getMemory(sessionId);
      await memory.saveContext({ input: trimmedMessage }, { output: response });
    } catch (memSaveErr) {
      console.warn("[AGENT ROUTER] Memory save warning:", memSaveErr.message);
    }

    // 8. Record Observability Metric
    observabilityService.logTransaction({
      sessionId,
      userId,
      query: trimmedMessage,
      intent,
      agentUsed,
      resolvedBy,
      latencyMs,
      success: resolvedBy !== "error_fallback",
      stateSnapshot: {
        currentStep: state.currentStep,
        city: state.city,
        selectedHotelId: state.selectedHotel?.hotelId,
        selectedRoomId: state.selectedRoom?.roomId,
      },
    });

    return {
      success: true,
      response,
      intent,
      agentUsed,
      resolvedBy,
      latencyMs: Math.round(latencyMs),
    };
  }
}

export const agentRouter = new AgentRouter();
