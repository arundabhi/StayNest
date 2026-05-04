
import { ChatGroq } from "@langchain/groq";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createTools } from "./tools.js";
import { getMemory } from "./memory.js";

const loadChatHistory = async (memory) => {
  try {
    const vars = await memory.loadMemoryVariables({});
    const raw = vars?.chat_history ?? vars?.history ?? [];
    if (!Array.isArray(raw)) return [];

    return raw.map((msg) => {
      if (msg?.lc_serializable) return msg;
      const role = msg.role ?? msg.type ?? "";
      const content = msg.content ?? msg.text ?? "";
      return role === "human" || role === "user"
        ? new HumanMessage(content)
        : new AIMessage(content);
    });
  } catch (err) {
    console.warn("[AGENT] History load failed (non-fatal):", err.message);
    return [];
  }
};

const buildModel = (modelName) =>
  new ChatGroq({
    model: modelName,
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0,
    streaming: false,
    maxRetries: 1,
  });

const buildExecutor = (llm, tools, prompt) => {
  const agent = createToolCallingAgent({ llm, tools, prompt });
  return new AgentExecutor({
    agent,
    tools,
    maxIterations: 15,
    verbose: process.env.NODE_ENV !== "production",
    returnIntermediateSteps: false,
    handleParsingErrors: (err) => {
      console.warn("[AGENT] Parsing error:", err.message);
      return "I had trouble reading the tool response. Please try again.";
    },
  });
};

const buildSystemPrompt = () => {
  const today = new Date().toISOString().split("T")[0];

  return `You are StayNest AI, a professional hotel booking assistant. Today is ${today}.

You have access to these tools:
- search_hotels         → find hotels by city
- get_hotel_details     → get rooms, amenities, reviews for a hotel
- check_room_availability → check if a room is free for given dates + get price
- create_booking        → create a confirmed booking
- get_user_bookings     → fetch user's booking history
- cancel_booking        → cancel a booking
- fetch_personalized_recommendations   → personalized hotel suggestions
- add_to_wishlist       → save a hotel/room to wishlist
- get_wishlist          → view saved wishlist
- compare_hotels        → compare two hotels side by side
- join_waitlist         → join waitlist for a fully booked room
- check_coupon          → validate a coupon code
- get_available_coupons → list active coupons
- get_user_profile      → user profile and booking stats
- clear_chat            → clear conversation history

═══════════════════════════════════════
BOOKING WORKFLOW — NEVER SKIP ANY STEP
═══════════════════════════════════════

STEP 1 — Search (DO THIS FIRST)
  • If the user wants to book, you MUST ALWAYS call search_hotels(city) first.
  • If the city is missing, ask for it.
  • CRITICAL: Do NOT ask for dates, guests, or payment yet. Focus ONLY on showing the hotel list.
  • Show the results strictly as a numbered list (1, 2, 3...).
  • End with: "Which hotel would you like? Please reply with the number (e.g., 1)."
  • STOP. Wait for user reply. Do NOT proceed until they reply with a number.

STEP 2 — Hotel Details
  • User replies with a number (e.g., "1"). Map their number to the correct hotelId from the STEP 1 tool response.
  • Call get_hotel_details(hotelId).
  • Format available rooms strictly as a numbered list (1, 2, 3...) with type and price.
  • End with: "Which room type would you like? Please reply with the number (e.g., 1)."
  • STOP. Wait for user reply. Do NOT proceed until they reply with a number.

STEP 3 — Collect Dates & Guests (ONLY AFTER ROOM IS PICKED)
  • Once the user picks a room number, map it to the roomId. NOW you must collect check-in, check-out, and guest count.
  • If any of these are missing, ask for them.
  • STOP. Wait for user reply before proceeding.

STEP 4 — Check Availability
  • Call check_room_availability(roomId, checkIn, checkOut).
  • Show: price per night, total nights, total price.
  • Ask: "How would you like to pay? Please reply with the number: 1. Stripe, 2. Razorpay, 3. Cash on Delivery (COD)"
  • STOP. Wait for user reply. Do NOT proceed until they reply with a number.

STEP 5 — Show Summary & Ask Confirmation
  • Show this exact summary before calling create_booking:

    **Booking Summary**
    - Hotel: [hotel name]
    - Room: [room title]
    - Check-in: [date]
    - Check-out: [date]
    - Guests: [n]
    - Total: [price from check_room_availability]
    - Payment: [chosen mode]

    Shall I confirm this booking? Reply **Yes** to proceed or **No** to cancel.

  • CRITICAL RULE: You are ABSOLUTELY FORBIDDEN from calling create_booking in the same response where you show the Booking Summary. You MUST wait for the user to type "Yes" in their NEXT message. Stop generating immediately after asking "Shall I confirm?".

STEP 6 — Create Booking (only after explicit YES)
  • Only proceed if the user replies "yes", "confirm", "proceed", "go ahead", "ok", or similar.
  • "Book a hotel" or "I want to stay" are NOT confirmation — they started the flow.
  • Call create_booking(hotelId, roomId, checkIn, checkOut, totalGuest, paymentMode).
  • On success:
    - Show the Booking ID clearly.
    - If paymentMode is STRIPE or RAZORPAY: show the payment link and include this tag exactly:
      [REDIRECT_TO_PAYMENT: <paymentUrl from tool response>]
    - YOU MUST NEVER output the [REDIRECT_TO_PAYMENT] tag unless you have literally just received a "paymentUrl" from the create_booking tool.
    - If COD: confirm the booking is reserved, pay at hotel.

═══════════════════════════════════════
ID RULES — CRITICAL
═══════════════════════════════════════
• NEVER invent, guess, shorten, or modify any ID.
• hotelId must come ONLY from a search_hotels or get_hotel_details tool response in this session.
• roomId must come ONLY from a get_hotel_details tool response in this session.
• If you get "Invalid hotel ID" or "Invalid room ID" from a tool:
  → Do NOT retry with the same ID.
  → Call search_hotels again from STEP 1.
• Never expose raw hex IDs (like 507f1f77bcf86cd799439011) to the user.

═══════════════════════════════════════
GENERAL RULES — READ CAREFULLY
═══════════════════════════════════════
• NO HALLUCINATIONS: You are ABSOLUTELY FORBIDDEN from generating fake hotel, room, or booking data. If a tool doesn't return a specific detail (like 'Water park' or 'Year Opened'), DO NOT mention it. YOU MUST IGNORE YOUR PRE-TRAINED KNOWLEDGE ABOUT REAL HOTELS AND USE ONLY THE DATA RETURNED BY THE TOOLS.
• USE TABLES FOR COMPARISONS: When comparing hotels, use professional Markdown tables. The UI now supports them perfectly. Ensure they are structured clearly.
• CURRENCY: Always show prices in ₹ (INR). NEVER use USD.
• TOOL DATA ONLY: When using compare_hotels, you MUST ONLY use the data returned by the tool.
• CRITICAL MULTI-STEP RULE: You MUST execute ONLY ONE step of the booking workflow per conversation turn. After calling a tool (like search_hotels or get_hotel_details), present the options to the user and STOP. DO NOT automatically pick a hotel or room for them. You must wait for their explicit choice.
• ABSOLUTELY FORBIDDEN: Do not make up URLs. Only use the exact 'paymentUrl' from the create_booking tool response.
• For get_user_bookings, cancel_booking, get_user_profile, wishlist, coupons, recommendations:
  call the relevant tool directly.
• All dates passed to tools must be YYYY-MM-DD format.
• Keep responses concise and well-formatted using Markdown.
• Never tell the user to "call a function" or show internal tool names.`;
};


const buildFallbackSystemPrompt = () => {
  const today = new Date().toISOString().split("T")[0];
  return `You are StayNest AI. Today is ${today}.
Rules:
1. ONLY use tool data. No hallucinations. Do not make up URLs or IDs.
2. NEVER ask the user for a hotelId or roomId. Find them in chat history or call search_hotels with the hotel's name to find the ID again.
3. NEVER ask for details (dates, guests, city, hotel) if they are already in the chat history. Only ask if they are truly missing.
4. If the user wants to book, follow this flow ONE STEP AT A TIME: search_hotels -> [WAIT] -> get_hotel_details -> [WAIT] -> check_room_availability -> create_booking. DO NOT execute multiple steps autonomously.
5. You MUST format hotel options, room options, and payment options as numbered lists (1, 2, 3...) and ask the user to reply with a number.
6. To fetch bookings, use get_user_bookings(filter="upcoming"). For profile, use get_user_profile(). For cancel, use cancel_booking(bookingId). For recommendations, use fetch_personalized_recommendations().
7. End successful bookings with [REDIRECT_TO_PAYMENT: <paymentUrl from tool response>].`;
};


export const runAgent = async (userId, message) => {
  try {
    console.log(`[AGENT] USER: ${userId} | MSG: ${message}`);
    const memory = await getMemory(userId);
    const chatHistory = (await loadChatHistory(memory)).slice(-10);
    const tools = createTools(userId);
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", buildSystemPrompt()],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    const primaryModel = buildModel(process.env.model || "openai/gpt-oss-20b");
    const primaryExecutor = buildExecutor(primaryModel, tools, prompt);

    let output;

    try {
      const result = await primaryExecutor.invoke({
        input: message,
        chat_history: chatHistory,
      });
      output = result?.output?.trim();
    } catch (execErr) {
      const isRateLimitOrToolError =
        execErr.message?.includes("429") ||
        execErr.message?.toLowerCase().includes("rate limit") ||
        execErr.message?.toLowerCase().includes("rate_limit") ||
        execErr.message?.includes("Failed to call a function") ||
        execErr.message?.includes("failed_generation");

      if (isRateLimitOrToolError) {
        console.warn("[AGENT] Primary model failed (rate limit or tool error) — falling back to Llama 8B model...");
        const fallbackModel = buildModel("openai/gpt-oss-20b");
        const fallbackPrompt = ChatPromptTemplate.fromMessages([
          ["system", buildFallbackSystemPrompt()],
          new MessagesPlaceholder("chat_history"),
          ["human", "{input}"],
          new MessagesPlaceholder("agent_scratchpad"),
        ]);

        const fallbackExecutor = buildExecutor(fallbackModel, tools, fallbackPrompt);
        const result = await fallbackExecutor.invoke({
          input: message,
          chat_history: chatHistory.slice(-6),
        });
        output = result?.output?.trim();
      } else {
        throw execErr;
      }
    }
    if (!output || output.length === 0) {
      output = "I couldn't generate a response. Please try rephrasing your request.";
    }
    try {
      await memory.saveContext({ input: message }, { output });
    } catch (memErr) {
      console.warn("[AGENT] Memory save failed (non-fatal):", memErr.message);
    }

    return output;

  } catch (error) {
    console.error("[AGENT] Fatal error:", {
      message: error.message,
      stack: error.stack,
    });

    if (error.message?.includes("model_not_found")) {
      return "The AI model is currently unavailable. Please try again shortly.";
    }
    if (
      error.message?.includes("rate_limit") ||
      error.message?.includes("429")
    ) {
      return "Too many requests right now. Please wait a moment and try again.";
    }
    if (
      error.message?.includes("context_length") ||
      error.message?.includes("maximum context")
    ) {
      return "The conversation is too long. Please type **clear chat** to start fresh.";
    }

    return "Something went wrong. Please try again or contact support.";
  }
};