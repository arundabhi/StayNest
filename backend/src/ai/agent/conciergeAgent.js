import { ChatGroq } from "@langchain/groq";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { createHotelTools } from "../tools/hotelTools.js";
import { userPreferenceService } from "../memory/userPreference.service.js";

export class ConciergeAgent {
  constructor() {
    this.llm = new ChatGroq({
      model: process.env.MODEL || "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.2,
      streaming: false,
    });
  }

  async run({ userId, sessionId, message, chatHistory = [], state = {} }) {
    const tools = createHotelTools(userId, sessionId);
    const preferences = await userPreferenceService.getPreferences(userId);
    const prefSummary = userPreferenceService.formatPreferencesForPrompt(preferences);

    const systemPrompt = `You are StayNest AI Luxury Concierge.
Your mission is to help travelers discover hotels, provide tailored recommendations, and present hotel highlights.

USER LONG-TERM PREFERENCES:
${prefSummary}

CURRENT CONVERSATION STATE:
- City: ${state.city || "Not specified"}
- Selected Hotel: ${state.selectedHotel?.hotelName || "None"}
- Selected Room: ${state.selectedRoom?.roomType || "None"}

GUIDELINES:
1. Always present hotels as a clean, numbered list (1, 2, 3...) with price in ₹, star rating, and standout amenities.
2. If the user mentions preferences (e.g. WiFi, swimming pool, sea view), highlight these attributes.
3. Keep your tone hospitable, welcoming, and crisp. Use Markdown styling.
4. When suggesting hotels, invite the user to pick by number (e.g. "Reply with 1 to see available rooms").`;

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
      maxIterations: 8,
      verbose: false,
    });

    const result = await executor.invoke({
      input: message,
      chat_history: chatHistory,
    });

    return result?.output?.trim() || "I couldn't find hotel recommendations matching that query.";
  }
}

export const conciergeAgent = new ConciergeAgent();
