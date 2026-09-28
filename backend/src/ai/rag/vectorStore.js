import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { MongoClient } from "mongodb";

let embeddingsInstance = null;
let activeVectorStore = null;

export const getEmbeddings = () => {
  if (!embeddingsInstance) {
    embeddingsInstance = new GoogleGenerativeAIEmbeddings({
      model: process.env.EMBEDDINGS_MODEL || "gemini-embedding-001",
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return embeddingsInstance;
};

export const getVectorStore = async () => {
  if (activeVectorStore) return activeVectorStore;

  const embeddings = getEmbeddings();

  // If MongoDB Atlas Vector Search index is configured
  if (
    process.env.MONGODB_URL &&
    process.env.ATLAS_VECTOR_INDEX_NAME &&
    process.env.NODE_ENV === "production"
  ) {
    try {
      const client = new MongoClient(process.env.MONGODB_URL);
      await client.connect();
      const collection = client.db().collection("hotel_embeddings");

      activeVectorStore = new MongoDBAtlasVectorSearch(embeddings, {
        collection,
        indexName: process.env.ATLAS_VECTOR_INDEX_NAME || "vector_index",
        textKey: "text",
        embeddingKey: "embedding",
      });
      console.log("✅ Atlas Vector Search Store Connected");
      return activeVectorStore;
    } catch (err) {
      console.warn("[VECTOR STORE] Atlas connection failed, using Memory fallback:", err.message);
    }
  }

  // Fallback to High-Performance Memory Vector Store
  activeVectorStore = new MemoryVectorStore(embeddings);
  return activeVectorStore;
};

export const resetVectorStore = () => {
  activeVectorStore = null;
};
