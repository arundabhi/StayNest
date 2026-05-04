// ai/intentRouter.js
//
// Returns one of two intents:
//   "action" → AgentExecutor  (tools: search, book, cancel, wishlist, etc.)
//   "info"   → RAG pipeline   (policy questions, how-to, general knowledge)
//
// Priority order (first match wins):
//   1. Greetings / small-talk          → action  (agent handles conversationally)
//   2. Explicit booking CRUD           → action
//   3. Room / hotel search & discovery → action
//   4. Wishlist / waitlist management  → action
//   5. Coupon / payment actions        → action
//   6. Profile / history management    → action
//   7. Policy / how-to questions       → info
//   8. Ambiguous questions about
//      cancellation, refund, payment   → info    (explain policy first)
//   9. Pure number input (selection)   → action
//  10. Default fallback                → info
//

const GREETING_PATTERNS = [
  /^(hi|hello|hey|howdy|hiya|sup|yo)\b/,
  /^good\s*(morning|afternoon|evening|night)\b/,
  /^(thanks|thank you|thx|ty)\b/,
  /^(bye|goodbye|see you|cya)\b/,
  /^(ok|okay|sure|got it|alright|sounds good|yes|no|confirm|proceed)\b/,
  /^(help|assist|start|begin)\b/,
  /^what can you (do|help|assist)/,
];

const BOOKING_ACTION_PATTERNS = [
  // Booking creation
  /\b(book|reserve|make a booking|create a booking|confirm booking)\b/,
  /\b(i want to (book|reserve|stay))\b/,
  /\b(book (me|a|this|that|the)?)\s*(room|hotel|suite|stay)/,

  // Booking cancellation (action — user wants to actually cancel)
  /\b(cancel|stop|terminate)\b.*\b(booking|reservation|stay|journey|trip)\b/,
  /\bcancell?(ing)?\b/,

  // Booking retrieval
  /\b(show|view|get|list|see|fetch|retrieve|display|find|where is|what is|check|status|details|info|summary)\b.*\b(booking|reservation|stay|journey|trip|history)(s)?\b/,
  /\bmy\b.*\b(booking|reservation|stay|journey|trip|history|status)(s)?\b/,
  /\bi\s+have\s+(a\s+)?(booking|reservation|stay|journey|trip|history)\b/,
  /\b(booking|reservation|stay|journey|trip) (history|details|status|info|summary)\b/,

  // Check-in / check-out dates context
  /\bcheck[- ]?in\s+(date|on|is|:)/,
  /\bcheck[- ]?out\s+(date|on|is|:)/,
];

const SEARCH_PATTERNS = [
  /\b(find|search|look for|show|list|get)\s+(hotels?|rooms?|stays?|properties|journeys?|trips?)\b/,
  /\b(hotels?|rooms?|stays?|journeys?|trips?)\s+in\b/,
  /\bavailable\s+(hotels?|rooms?|stays?)\b/,
  /\bcheck\s+(availability|available)\b/,
  /\b(recommend|suggest)(ation|ion)?s?\s+(hotels?|rooms?|a place|somewhere|for me|stays?)\b/,
  /\bget\s+(my\s+)?recommendations?\b/,
  /\bhotel\s+details?\b/,
  /\broom\s+details?\b/,
  /\bshow\s+me\s+(hotels?|rooms?|options?)\b/,
  /\bwhat('s|\s+is)\s+available\b/,
  /\bcompare\b/
];

const WISHLIST_WAITLIST_PATTERNS = [
  /\b(add to|save to|put in)\s+(my\s+)?(wishlist|favorites?|saved)\b/,
  /\b(show|view|get|see)\s+(my\s+)?(wishlist|favorites?|saved (hotels?|rooms?))\b/,
  /\bmy (wishlist|saved|favorites?)\b/,
  /\b(join|add me to|put me on)\s+(the\s+)?waitlist\b/,
  /\bwaitlist\s+(for|me|please)\b/,
];

const COUPON_PAYMENT_ACTION_PATTERNS = [
  /\b(apply|use|enter|add)\s+(a\s+)?(coupon|promo|discount|code)\b/,
  /\b(show|list|get|available)\s+(coupons?|promo(s|codes?)?|offers?|deals?)\b/,
  /\bdo you have (any )?(coupons?|offers?|deals?|discounts?)\b/,
  /\bpay\s+(now|with|using|via|by)\b/,
  /\b(stripe|razorpay)\s*(pay|payment)?\b/,
  /\bcod\b/,
  /\bcomplete\s+(the\s+)?payment\b/,
];

const PROFILE_PATTERNS = [
  /\b(show|view|get|see)\s+(my\s+)?(profile|account|info(rmation)?)\b/,
  /\bmy (profile|account|details?)\b/,
  /\b(clear|reset|start)\s+(chat|conversation|history|fresh)\b/,
  /\bstart\s+(over|fresh|again|new)\b/,
];

const INFO_PATTERNS = [
  /\b(what('s|\s+is)|explain|tell me about|describe)\s+(the\s+)?(cancellation|refund|payment|booking|hotel)\s+policy\b/,
  /\b(cancellation|refund|return)\s+policy\b/,
  /\bhow\s+does?\s+(cancellation|refund|booking|payment|checkout|checkin|check-in|check-out)\s+work\b/,
  /\bwhat\s+happens\s+(if|when|after)\b/,
  /\bwhat\s+payment\s+methods?\b/,
  /\bwhich\s+payment\s+(methods?|options?)\s+(are\s+)?(supported|available|accepted)\b/,
  /\b(accepted|supported|available)\s+payment\b/,
  /\bdo you (accept|support|take)\b/,
  /\bhow\s+(do|can|to|should)\s+(i|we|you|one)\b/,
  /\bhow\s+(to|do)\s+(book|cancel|pay|check|use|apply|join|get)\b/,
  /\b(steps?|guide|instructions?|process)\s+(to|for|on)\b/,
  /\bcan\s+i\s+(cancel|refund|change|modify|update|add)\b/,
  /\bwhat\s+(is|are|does|do|should|can)\b/,
  /\bwhy\s+(is|are|do|does|can|should|would)\b/,
  /\bwhen\s+(can|should|do|is|are|will)\b/,
  /\bwhere\s+(can|is|are|do|should)\b/,
  /\bwho\s+(is|are|can|should)\b/,
  /\btell\s+me\s+(about|more|everything)\b/,
  /\bexplain\b/,
  /\bwhat('s|\s+is)\s+(staynest|your\s+platform|this\s+app|this\s+site)\b/,
];

const AMBIGUOUS_INFO_PATTERNS = [
  /\b(cancel|cancell?ation|refund)\b.*\?/,
  /\brefund\b/,
  /\bis\s+(there|it)\s+(a\s+)?(fee|charge|penalty)\b/,
  /\bget\s+(my\s+)?(money|refund)\s+back\b/,
];

const matchesAny = (patterns, text) =>
  patterns.some((pattern) => pattern.test(text));

const isPureNumberInput = (text) => /^\s*\d+\s*$/.test(text);

export const detectIntent = async (message, chatHistory = []) => {
  try {
    if (!message || typeof message !== "string") return "info";

    const lower = message.toLowerCase().trim();

    // Check conversational context: if the last AI message asked for action details,
    // default to action instead of info.
    let lastAIMessage = "";
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      for (let i = chatHistory.length - 1; i >= 0; i--) {
        const msg = chatHistory[i];
        // Accommodate Langchain base messages and raw objects
        const role = msg.role || msg.type || (msg.id && Array.isArray(msg.id) ? msg.id[msg.id.length - 1] : "");
        if (role.toLowerCase() === "ai" || role === "AIMessage") {
          lastAIMessage = (msg.content || msg.text || "").toLowerCase();
          break;
        }
      }
    }

    const actionPrompts = [
      "which hotel",
      "which room",
      "how would you like to pay",
      "reply with the number",
      "shall i confirm",
      "please tell me the name of the hotel",
      "name of the hotel you'd like to save",
      "what city",
      "dates for your stay",
      "how many guests"
    ];

    const isActionContext = actionPrompts.some(prompt => lastAIMessage.includes(prompt));

    if (isActionContext) {
      return "action";
    }

    if (matchesAny(INFO_PATTERNS, lower)) {
      return "info";
    }

    if (matchesAny(AMBIGUOUS_INFO_PATTERNS, lower)) {
      return "info";
    }

    if (matchesAny(GREETING_PATTERNS, lower)) {
      return "action";
    }

    if (matchesAny(BOOKING_ACTION_PATTERNS, lower)) {
      return "action";
    }

    if (matchesAny(SEARCH_PATTERNS, lower)) {
      return "action";
    }

    if (matchesAny(WISHLIST_WAITLIST_PATTERNS, lower)) {
      return "action";
    }

    if (matchesAny(COUPON_PAYMENT_ACTION_PATTERNS, lower)) {
      return "action";
    }

    if (matchesAny(PROFILE_PATTERNS, lower)) {
      return "action";
    }

    if (isPureNumberInput(lower)) {
      return "action";
    }

    return "info";

  } catch (error) {
    console.error("[INTENT ROUTER] Detection error:", error);
    return "info";
  }
};