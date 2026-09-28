import { ChatGroq } from "@langchain/groq";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { createHotelTools } from "../tools/hotelTools.js";
import { createBookingTools } from "../tools/bookingTools.js";

export class BookingAgent {
  constructor() {
    this.llm = new ChatGroq({
      model: process.env.MODEL || "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0,
      streaming: false,
    });
  }

  async run({ userId, sessionId, message, chatHistory = [], state = {} }) {
    const hotelTools = createHotelTools(userId, sessionId);
    const bookingTools = createBookingTools(userId, sessionId);
    const tools = [...hotelTools, ...bookingTools];

    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `You are StayNest AI Booking Reservation Specialist. Today's date is ${today}.
Your objective is to help the user book a hotel room, check room availability, view existing bookings, or cancel bookings.

CURRENT STRUCTURED CONVERSATION STATE:
- City: ${state.city || "Not selected"}
- Selected Hotel: ${state.selectedHotel ? `${state.selectedHotel.hotelName} (ID: ${state.selectedHotel.hotelId})` : "None"}
- Selected Room: ${state.selectedRoom ? `${state.selectedRoom.title || state.selectedRoom.roomType} (ID: ${state.selectedRoom.roomId}, Price: ₹${state.selectedRoom.price})` : "None"}
- Booking Dates: ${state.bookingDetails ? `${state.bookingDetails.checkIn} to ${state.bookingDetails.checkOut} (${state.bookingDetails.guests} guests)` : "None"}
- Payment Method: ${state.paymentMethod || "None"}
- Current Step: ${state.currentStep || "IDLE"}

RULES:
1. Always utilize the IDs from CURRENT CONVERSATION STATE when available. Do NOT ask the user for raw database IDs.
2. When room and dates are chosen, check availability and explicitly offer the payment methods:
   "💳 **How would you like to pay?**
   1. **Stripe** (Credit / Debit Card)
   2. **Razorpay** (UPI, Netbanking, Cards)
   3. **Pay at Hotel** (Cash on Arrival / COD)"
3. When payment mode is chosen, display the complete Booking Summary (Hotel, Room, Dates, Guests, Total ₹, Payment Method) and ask:
   "Shall I confirm this booking? Reply **Yes** to confirm or **No** to cancel."
4. When booking is created with online payment (Stripe / Razorpay), provide the direct payment link and include [REDIRECT_TO_PAYMENT: <paymentUrl>] so the assistant redirects the user immediately on-screen. NEVER tell the user to check their email for payment links.`;

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    const agent = createToolCallingAgent({ llm: this.llm, tools, prompt });
    const executor = new AgentExecutor({
      agent,
      tools,
      maxIterations: 10,
      verbose: false,
    });

    const result = await executor.invoke({
      input: message,
      chat_history: chatHistory,
    });

    return result?.output?.trim() || "I couldn't process your booking request. Please check your details.";
  }
}

export const bookingAgent = new BookingAgent();
