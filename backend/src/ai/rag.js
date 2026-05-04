import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { Hotel } from "../models/hotel.models.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let vectorStore = null;
let isInitializing = false;

export const initRAG = async () => {
  if (vectorStore) return;
  if (isInitializing) return;

  isInitializing = true;
  const startTime = Date.now();
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: process.env.EMBEDDINGS_MODEL || "gemini-embedding-001",
      apiKey: process.env.GEMINI_API_KEY,
    });


    const fetchStart = Date.now();
    const faqPath = path.join(__dirname, "data", "faqs.json");
    const faqs = JSON.parse(fs.readFileSync(faqPath, "utf-8"));
    const faqDocs = faqs.map(
      (f) =>
        new Document({
          pageContent: f.answer,
          metadata: { type: "faq", question: f.question },
        })
    );

    const hotels = await Hotel.find({ isActive: true });
    const hotelDocs = hotels.map(
      (h) =>
        new Document({
          pageContent: `Hotel Name: ${h.name}\nLocation: ${h.city}, ${h.state}\nPrice: ${h.basePrice}\nDescription: ${h.description}\nAmenities: ${h.amenities.join(", ")}`,
          metadata: { type: "hotel", id: h._id, name: h.name },
        })
    );

    const allDocs = [...faqDocs, ...hotelDocs];
    console.log(`[RAG] Fetched ${allDocs.length} docs in ${Date.now() - fetchStart}ms`);

    
    const embedStart = Date.now();
    vectorStore = await MemoryVectorStore.fromDocuments(allDocs, embeddings);
    console.log(`[RAG] Generated embeddings for ${allDocs.length} docs in ${Date.now() - embedStart}ms`);
    
    console.log(`[PERF] RAG System total initialization took ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error("Error initializing RAG:", error);
  } finally {
    isInitializing = false;
  }
};

export const queryRAG = async (query) => {
  try {
    if (!vectorStore) {
      await initRAG();
    }

    if (!vectorStore) {
      return null;
    }

    const results = await vectorStore.similaritySearch(query, 1);

    if (!results || results.length === 0) {
      return null;
    }

    return results[0].pageContent;

  } catch (error) {
    console.error("RAG Query Error:", error);
    return null;
  }
};
