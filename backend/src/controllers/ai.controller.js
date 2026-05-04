

import { performance } from "perf_hooks";
import { detectIntent } from "../ai/intentRouter.js";
import { queryRAG } from "../ai/rag.js";
import { runAgent } from "../ai/agent.js";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import mongoose from "mongoose";


const getRagLLM = () =>
  new ChatGroq({
    model: process.env.MODEL || "llama-3.3-70b-versatile",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.3,
    streaming: false,
    maxRetries: 1,
  });


const handleRAG = async (message) => {
  const context = await queryRAG(message);


  const isEmpty =
    !context ||
    context.trim().length === 0 ||
    context.toLowerCase().includes("couldn't find") ||
    context.toLowerCase().includes("no relevant") ||
    context.toLowerCase().includes("not found");

  if (isEmpty) return null;

  const llm = getRagLLM();

  const systemPrompt = `You are StayNest AI, a professional hotel booking assistant.
Answer the user's question using ONLY the context provided below.
Keep your answer concise, accurate, and friendly.
If the context does not fully answer the question, say so honestly — do not invent information.
Do not mention "context" or "documents" in your reply — speak naturally as the assistant.`;

  const userPrompt = `Context:
${context}

User question:
${message}`;

  const result = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ]);

  return result?.content?.trim() || null;
};


const elapsed = (start) => `${(performance.now() - start).toFixed(2)}ms`;


export const chatWithAI = async (req, res) => {
  const totalStart = performance.now();

  try {
 
    const { message } = req.body;
    const userId = req.userId;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required and must be a non-empty string.",
      });
    }

    const trimmedMessage = message.trim();

  
    if (
      trimmedMessage.toLowerCase().includes("clear chat") ||
      trimmedMessage.toLowerCase().includes("reset chat")
    ) {
      console.log(`[ACTION]  Clearing chat for user: ${userId}`);

      const db = mongoose.connection.db;
      if (!db) {
        throw new Error("Database connection not ready");
      }

      const collection = db.collection("chat_history");


      const result = await collection.deleteMany({
        $or: [
          { sessionId: userId.toString() },
          { sessionId: userId }
        ]
      });

      console.log(`[ACTION]  Deleted ${result.deletedCount} history documents.`);

      return res.status(200).json({
        success: true,
        response: "Conversation history has been cleared. You can start fresh now!",
        intent: "action",
        resolvedBy: "manual_bypass",
      });
    }

    console.log(`\n${"─".repeat(60)}`);
    console.log(`[CHAT]    User    : ${userId}`);
    console.log(`[CHAT]    Message : ${trimmedMessage}`);

    const intentStart = performance.now();


    const { getMemory } = await import("../ai/memory.js");
    const memory = await getMemory(userId);
    const vars = await memory.loadMemoryVariables({});
    const chatHistory = vars?.chat_history ?? vars?.history ?? [];

    let intent = await detectIntent(trimmedMessage, chatHistory);
    console.log(`[INTENT]  ${intent.toUpperCase()}  (${elapsed(intentStart)})`);


    let response = null;
    let resolvedBy = intent; 


    if (intent === "action") {
      console.log("[ROUTE]   → Agent (tools)");
      const t = performance.now();

      response = await runAgent(userId, trimmedMessage);

      console.log(`[PERF]    Agent : ${elapsed(t)}`);
    }

    else {
      console.log("[ROUTE]   → RAG");
      const t = performance.now();

      response = await handleRAG(trimmedMessage);

      console.log(`[PERF]    RAG   : ${elapsed(t)}`);


      if (!response) {
        console.log("[FALLBACK] RAG empty → Agent");
        resolvedBy = "agent_fallback";
        const t2 = performance.now();

        response = await runAgent(userId, trimmedMessage);

        console.log(`[PERF]    Agent (fallback) : ${elapsed(t2)}`);
      }
    }

    if (!response || response.trim().length === 0) {
      response =
        "I wasn't able to find an answer right now. Please try rephrasing your question.";
      resolvedBy = "fallback_message";
    }

    console.log(`[PERF]    TOTAL : ${elapsed(totalStart)}`);
    console.log(`[RESOLVED BY]  : ${resolvedBy}`);
    console.log("─".repeat(60));

    return res.status(200).json({
      success: true,
      response,
      intent,
      resolvedBy,
    });

  } catch (error) {
    console.error(`[ERROR] Controller failure (${elapsed(totalStart)}):`, {
      message: error.message,
      stack: error.stack,
    });

    const status =
      error.message?.includes("Invalid") || error.message?.includes("required")
        ? 400
        : 500;

    return res.status(status).json({
      success: false,
      message:
        status === 400
          ? error.message
          : "Something went wrong on our end. Please try again.",
    });
  }
};