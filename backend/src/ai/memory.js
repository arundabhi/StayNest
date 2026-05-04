import { BufferMemory } from "langchain/memory";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { MongoClient } from "mongodb";

let client;
let collection;

export const getMemory = async (userId) => {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URL);
    await client.connect();

    const db = client.db();
    collection = db.collection("chat_history");

    console.log("✅ MongoDB Memory Connected");
  }

  const chatHistory = new MongoDBChatMessageHistory({
    collection,
    sessionId: userId,
  });

  
  if (!chatHistory.addAIChatMessage) {
    chatHistory.addAIChatMessage = (message) => chatHistory.addAIMessage(message);
  }


  return new BufferMemory({
    memoryKey: "chat_history",
    returnMessages: true,
    inputKey: "input",
    outputKey: "output",
    chatHistory: chatHistory,
  });
};