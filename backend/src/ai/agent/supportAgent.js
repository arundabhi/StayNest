import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { hotelRagService } from "../rag/hotelRag.service.js";

export class SupportAgent {
  constructor() {
    this.llm = new ChatGroq({
      model: process.env.MODEL || "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.2,
      streaming: false,
    });
  }

  async run({ userId, message, chatHistory = [], state = {} }) {
    // 1. Retrieve context from Advanced Hotel RAG
    const ragContext = await hotelRagService.queryRAG(message, {
      hotelId: state.selectedHotel?.hotelId,
    });

    const systemPrompt = `You are StayNest AI Customer Support & Policy Concierge.
Your mission is to resolve questions regarding hotel policies, cancellation rules, refunds, check-in/out timings, house rules, and amenities.

KNOWLEDGE CONTEXT:
${ragContext || "Standard StayNest 24hr free cancellation and full refund policy applies."}

CURRENT CONVERSATION STATE:
- Currently Selected Hotel: ${state.selectedHotel?.hotelName || "None specified"}
- City: ${state.city || "N/A"}

GUIDELINES:
1. Provide accurate, direct, and reassuring answers based on the knowledge context.
2. If discussing cancellations or refunds, clearly mention timelines (e.g. 24-hr free cancellation, 3-5 days refund processing).
3. Do not invent policies. If details are not in context, offer to connect with hotel reception or support.`;

    const response = await this.llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(message),
    ]);

    return response?.content?.trim() || "I can help answer your questions about StayNest policies, cancellations, and amenities.";
  }
}

export const supportAgent = new SupportAgent();
