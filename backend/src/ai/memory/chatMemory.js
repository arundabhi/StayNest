import { BufferMemory } from "langchain/memory";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { MongoClient } from "mongodb";

let client = null;
let collection = null;

export const getChatMessageHistory = async (sessionId) => {
  if (!client) {
    const mongoUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/staynest";
    client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db();
    collection = db.collection("chat_history");
    // Ensure index on sessionId for fast history retrieval
    await collection.createIndex({ sessionId: 1 });
    console.log("✅ MongoDB Chat Message History Initialized");
  }

  const chatHistory = new MongoDBChatMessageHistory({
    collection,
    sessionId: sessionId.toString(),
  });

  if (!chatHistory.addAIChatMessage) {
    chatHistory.addAIChatMessage = (message) => chatHistory.addAIMessage(message);
  }

  return chatHistory;
};

export const getMemory = async (sessionId) => {
  const chatHistory = await getChatMessageHistory(sessionId);

  return new BufferMemory({
    memoryKey: "chat_history",
    returnMessages: true,
    inputKey: "input",
    outputKey: "output",
    chatHistory,
  });
};
