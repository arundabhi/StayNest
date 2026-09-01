import { ChatGroq } from "@langchain/groq";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createTools } from "./tools.js";
import { getMemory } from "./memory.js";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const PRIMARY_MODEL = process.env.MODEL;
const FALLBACK_MODEL = process.env.FALLBACK_MODEL || "openai/gpt-oss-20b";
const MAX_HISTORY = 12;
const FALLBACK_HISTORY = 6;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Detect whether the user's message contains ALL booking details
 * needed for direct (one-shot) booking.
 * Required: hotel name/city + room type + check-in + check-out + guests + payment mode
 */
const isDirectBookingRequest = (message) => {
  const lower = message.toLowerCase();

  const hasBookIntent = /\b(book|reserve|confirm|i want to stay|make a booking)\b/.test(lower);
  const hasHotel = /\b(hotel|inn|resort|suites?|stay)\b/.test(lower);
  const hasDates = /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/.test(lower);
  const hasGuests = /\b(\d+)\s*(guest|person|people|adult|pax|night)\b/.test(lower);
  const hasPayment = /\b(stripe|razorpay|cod|cash|upi|card|online)\b/.test(lower);
  const hasRoomType = /\b(deluxe|suite|standard|single|double|twin|king|queen|room)\b/.test(lower);

  return hasBookIntent && hasHotel && hasDates && hasGuests && hasPayment && hasRoomType;
};

/**
 * Load and normalise chat history from MongoDB memory.
 * Returns LangChain message objects ready to inject into the prompt.
 */
const loadChatHistory = async (memory) => {
  try {
    const vars = await memory.loadMemoryVariables({});
    const raw = vars?.chat_history ?? vars?.history ?? [];
    if (!Array.isArray(raw)) return [];

    return raw.map((msg) => {
      // Already a proper LangChain message — return as-is
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

// ─────────────────────────────────────────────────────────────
// MODEL FACTORY
// ─────────────────────────────────────────────────────────────
const buildModel = (modelName, apiKey = process.env.GROQ_API_KEY) =>
  new ChatGroq({
    model: modelName,
    apiKey: apiKey || process.env.GROQ_API_KEY,
    temperature: 0,
    streaming: false,
    maxRetries: 1,
  });

// ─────────────────────────────────────────────────────────────
// AGENT EXECUTOR FACTORY
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT  (primary model)
// ─────────────────────────────────────────────────────────────
const buildSystemPrompt = () => {
  const today = new Date().toISOString().split("T")[0];

  return `You are StayNest AI, a professional hotel booking assistant. Today is ${today}.

AVAILABLE TOOLS:
- search_hotels                      → find hotels by city
- get_hotel_details                  → rooms, amenities, reviews for a hotel
- check_room_availability            → check dates + get final price
- create_booking                     → create a confirmed booking
- get_user_bookings                  → user's booking history
- cancel_booking                     → cancel a booking
- fetch_personalized_recommendations → personalized hotel suggestions
- add_to_wishlist                    → save a hotel/room to wishlist
- get_wishlist                       → view saved wishlist
- compare_hotels                     → compare two hotels side by side
- join_waitlist                      → join waitlist for a fully booked room
- check_coupon                       → validate a coupon code
- get_available_coupons              → list active coupons
- get_user_profile                   → user profile and booking stats
- clear_chat                         → clear conversation history

══════════════════════════════════════════════════════
BOOKING MODE — READ THIS FIRST BEFORE EVERY BOOKING
══════════════════════════════════════════════════════

There are TWO booking modes. Choose the correct one based on how much info the user gave.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE A — DIRECT BOOKING (skip steps 1-5, go straight to booking)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use MODE A ONLY when the user provides ALL SIX of these in one message:
  ✓ Hotel name or city
  ✓ Room type (deluxe / suite / standard / etc.)
  ✓ Check-in date
  ✓ Check-out date
  ✓ Number of guests
  ✓ Payment method (Stripe / Razorpay / COD)

If ALL SIX are present → execute this sequence AUTOMATICALLY without stopping:
  1. search_hotels(city or hotel name)
  2. get_hotel_details(hotelId) — pick the room that best matches the requested type
  3. check_room_availability(roomId, checkIn, checkOut)
  4. create_booking(hotelId, roomId, checkIn, checkOut, guests, paymentMode)
  5. Show Booking ID + payment link (if online payment) and include:
     [REDIRECT_TO_PAYMENT: <paymentUrl from tool response>]

  DO NOT ask for confirmation. DO NOT show a summary. DO NOT stop between steps.
  If year is missing from dates, assume current year (${today.split("-")[0]}).
  If the requested room type is unavailable, pick the closest available type and inform the user.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE B — STEP-BY-STEP BOOKING (default when info is incomplete)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use MODE B when ANY of the six details above is missing.
Follow each step strictly. STOP after each step and wait for the user.

STEP 1 — Search Hotels
  • Call search_hotels(city). If city is missing, ask for it first.
  • Show results as a numbered list (1, 2, 3...) with name, city, and price.
  • End with: "Which hotel would you like? Reply with the number."
  • STOP. Do NOT ask for dates or guests yet.

STEP 2 — Room Selection
  • Map user's number to hotelId from Step 1 results.
  • Call get_hotel_details(hotelId).
  • Show available rooms as a numbered list with type and price per night.
  • End with: "Which room type would you like? Reply with the number."
  • STOP.

STEP 3 — Collect Dates & Guests
  • Map user's number to roomId from Step 2 results.
  • Ask for: check-in date, check-out date, number of guests (all in one message).
  • If year is missing from any date, assume ${today.split("-")[0]}.
  • STOP.

STEP 4 — Availability & Payment
  • Call check_room_availability(roomId, checkIn, checkOut).
  • Show: price per night, total nights, total price in ₹.
  • Ask: "How would you like to pay?\n1. Stripe\n2. Razorpay\n3. Cash on Delivery (COD)"
  • STOP.

STEP 5 — Booking Summary
  • Show this summary EXACTLY before booking:

    **Booking Summary**
    - Hotel: [hotel name]
    - Room: [room type]
    - Check-in: [date]
    - Check-out: [date]
    - Guests: [n]
    - Total: ₹[amount]
    - Payment: [method]

    Shall I confirm this booking? Reply **Yes** to confirm or **No** to cancel.

  • ⛔ FORBIDDEN: Do NOT call create_booking in the same response as this summary.
  • STOP. Wait for explicit "Yes".

STEP 6 — Create Booking
  • Proceed ONLY if user says: yes / confirm / proceed / go ahead / ok / done
  • "Book a hotel" is NOT confirmation — it starts the flow.
  • Call create_booking(hotelId, roomId, checkIn, checkOut, totalGuest, paymentMode).
  • On success:
    - Show Booking ID clearly.
    - STRIPE / RAZORPAY: show payment link + [REDIRECT_TO_PAYMENT: <paymentUrl>]
    - COD: confirm booking is reserved, pay at hotel.

══════════════════════════════════════════════════════
ID RULES — NEVER BREAK THESE
══════════════════════════════════════════════════════
• NEVER invent, guess, shorten, or modify any ID.
• hotelId → ONLY from search_hotels or get_hotel_details response.
• roomId  → ONLY from get_hotel_details response.
• If you receive "Invalid hotel ID" or "Invalid room ID":
  → Do NOT retry the same ID.
  → Restart from search_hotels.
• Never show raw hex IDs (e.g. 507f1f77bcf86cd799439011) to the user.

══════════════════════════════════════════════════════
GENERAL RULES
══════════════════════════════════════════════════════
• NO HALLUCINATIONS: Only use data returned by tools. Never invent hotel names, room details, prices, or URLs. Ignore all pre-trained knowledge about real hotels.
• CURRENCY: Always show prices in ₹ (INR). Never use USD or any other currency.
• STRICT SELECTION: If user asks to compare specific hotels, ONLY use those hotels. Do not suggest alternatives unless asked.
• COMPARISONS: Use well-formatted Markdown tables. Only use data from compare_hotels tool.
• PAYMENT URL: Never fabricate a payment URL. Only output [REDIRECT_TO_PAYMENT:...] when paymentUrl is literally present in the create_booking tool response.
• DATE FORMAT: All dates passed to tools must be YYYY-MM-DD.
• TOOL NAMES: Never mention tool names or function names to the user.
• DIRECT ACTIONS: For get_user_bookings, cancel_booking, get_user_profile, wishlist, coupons, recommendations — call the relevant tool directly without step-by-step confirmation.
• FORMATTING: Keep responses concise and well-formatted using Markdown.`;
};

// ─────────────────────────────────────────────────────────────
// FALLBACK SYSTEM PROMPT  (used when primary model rate-limits)
// ─────────────────────────────────────────────────────────────
const buildFallbackSystemPrompt = () => {
  const today = new Date().toISOString().split("T")[0];
  const year = today.split("-")[0];

  return `You are StayNest AI, a hotel booking assistant. Today is ${today}.

CORE RULES:
1. Only use tool data. Never hallucinate hotels, rooms, prices, or URLs.
2. Never ask for hotelId or roomId — get them by calling search_hotels or get_hotel_details.
3. Never re-ask for details already in chat history.
4. Dates: always YYYY-MM-DD. If year is missing, assume ${year}.
5. Currency: always ₹ (INR). Never USD.
6. Never show raw hex IDs to the user.

DIRECT BOOKING:
If the user provides hotel name/city + room type + check-in + check-out + guests + payment method all at once:
→ Run search_hotels → get_hotel_details → check_room_availability → create_booking automatically.
→ Do NOT stop for confirmation. Show Booking ID + [REDIRECT_TO_PAYMENT: <paymentUrl>] on success.

STEP-BY-STEP BOOKING (when details are missing):
search_hotels → [WAIT for hotel choice] → get_hotel_details → [WAIT for room choice]
→ [WAIT for dates/guests] → check_room_availability → [WAIT for payment choice]
→ Show summary → [WAIT for Yes] → create_booking

FORMAT: Show hotel and room options as numbered lists. Ask user to reply with a number.

DIRECT ACTIONS (no confirmation needed):
- View bookings   → get_user_bookings(filter="upcoming")
- Cancel booking  → cancel_booking(bookingId)
- Profile         → get_user_profile()
- Recommendations → fetch_personalized_recommendations()
- Coupons         → get_available_coupons()

PAYMENT: Output [REDIRECT_TO_PAYMENT: <paymentUrl>] ONLY when paymentUrl is in the create_booking tool response.`;
};

// ─────────────────────────────────────────────────────────────
// RATE LIMIT / TOOL ERROR DETECTOR
// ─────────────────────────────────────────────────────────────
const isRetryableError = (err) => {
  const msg = err?.message?.toLowerCase() ?? "";
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("rate_limit") ||
    msg.includes("failed to call a function") ||
    msg.includes("failed_generation") ||
    msg.includes("overloaded") ||
    msg.includes("service unavailable")
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export const runAgent = async (userId, message) => {
  try {
    const trimmed = message?.trim();
    if (!trimmed) return "Please send a message so I can help you.";

    console.log(`[AGENT] USER: ${userId} | MODE: ${isDirectBookingRequest(trimmed) ? "DIRECT" : "STEP-BY-STEP"} | MSG: ${trimmed}`);

    // Load memory + history
    const memory = await getMemory(userId);
    const chatHistory = (await loadChatHistory(memory)).slice(-MAX_HISTORY);

    // Create tools scoped to this user
    const tools = createTools(userId);

    // Build prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", buildSystemPrompt()],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    // Build primary executor
    const primaryExecutor = buildExecutor(buildModel(PRIMARY_MODEL), tools, prompt);

    let output;

    // ── Primary model attempt ──────────────────────────────
    try {
      const result = await primaryExecutor.invoke({
        input: trimmed,
        chat_history: chatHistory,
      });
      output = result?.output?.trim();

    } catch (execErr) {

      if (isRetryableError(execErr)) {
        // ── Fallback model attempt ─────────────────────────
        console.warn("[AGENT] Primary model failed → switching to fallback model...");

        const fallbackPrompt = ChatPromptTemplate.fromMessages([
          ["system", buildFallbackSystemPrompt()],
          new MessagesPlaceholder("chat_history"),
          ["human", "{input}"],
          new MessagesPlaceholder("agent_scratchpad"),
        ]);

        const fallbackApiKey = process.env.GROQ_API_KEY_FALLBACK || process.env.GROQ_API_KEY;
        const fallbackExecutor = buildExecutor(
          buildModel(FALLBACK_MODEL, fallbackApiKey),
          tools,
          fallbackPrompt
        );

        const result = await fallbackExecutor.invoke({
          input: trimmed,
          chat_history: chatHistory.slice(-FALLBACK_HISTORY),
        });
        output = result?.output?.trim();

      } else {
        throw execErr; // bubble up to outer catch
      }
    }

    // ── Safety net for empty output ────────────────────────
    if (!output || output.length === 0) {
      output = "I couldn't generate a response. Please try rephrasing your request.";
    }

    // ── Persist to memory (non-fatal) ──────────────────────
    try {
      await memory.saveContext({ input: trimmed }, { output });
    } catch (memErr) {
      console.warn("[AGENT] Memory save failed (non-fatal):", memErr.message);
    }

    return output;

  } catch (error) {
    // ── Outer fatal error handler ──────────────────────────
    console.error("[AGENT] Fatal error:", {
      message: error.message,
      stack: error.stack,
    });

    const msg = error.message?.toLowerCase() ?? "";

    if (msg.includes("model_not_found")) {
      return "The AI model is currently unavailable. Please try again shortly.";
    }
    if (msg.includes("rate_limit") || msg.includes("429")) {
      return "We're experiencing high traffic. Please wait a moment and try again.";
    }
    if (msg.includes("context_length") || msg.includes("maximum context")) {
      return "The conversation is too long. Please type **clear chat** to start fresh.";
    }
    if (msg.includes("network") || msg.includes("econnrefused") || msg.includes("timeout")) {
      return "A network error occurred. Please check your connection and try again.";
    }

    return "Something went wrong. Please try again or contact support.";
  }
};