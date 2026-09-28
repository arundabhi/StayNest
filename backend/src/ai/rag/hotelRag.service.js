import { Document } from "@langchain/core/documents";
import { Hotel } from "../../models/hotel.models.js";
import { Room } from "../../models/room.models.js";
import { Review } from "../../models/review.models.js";
import { getVectorStore, getEmbeddings } from "./vectorStore.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class HotelRagService {
  constructor() {
    this.vectorStore = null;
    this.isIndexing = false;
    this.lastIndexedAt = null;
  }

  /**
   * Ingest and build multi-dimensional documents from MongoDB models and FAQs
   */
  async buildDocuments() {
    const documents = [];

    // 1. FAQs & Policy Documents
    try {
      const faqPath = path.join(__dirname, "..", "data", "faqs.json");
      if (fs.existsSync(faqPath)) {
        const faqs = JSON.parse(fs.readFileSync(faqPath, "utf-8"));
        for (const f of faqs) {
          documents.push(
            new Document({
              pageContent: `Question: ${f.question}\nAnswer: ${f.answer}\nCategory: ${f.category || "General Policy"}`,
              metadata: {
                type: "faq",
                category: f.category || "policy",
                question: f.question,
              },
            })
          );
        }
      }
    } catch (err) {
      console.warn("[RAG] FAQ loading warning:", err.message);
    }

    // Default Cancellation & Refund Knowledge Document
    documents.push(
      new Document({
        pageContent:
          `StayNest Cancellation & Refund Policy:\n` +
          `1. Free Cancellation: Full refund if cancelled 24 hours prior to standard check-in time (12:00 PM).\n` +
          `2. Late Cancellation: If cancelled within 24 hours of check-in, the first night stay is charged as penalty.\n` +
          `3. Refund Timeline: Online payments (Stripe/Razorpay) are refunded within 3-5 business days.\n` +
          `4. Pay at Hotel (COD): No cancellation fee, but we request cancellation as early as possible so rooms can be freed for waitlisted guests.\n` +
          `5. Modification: Check-in dates can be modified subject to room availability.`,
        metadata: { type: "policy", topic: "cancellation_refund" },
      })
    );

    // 2. Hotel Multi-Aspect Documents
    try {
      const hotels = await Hotel.find({ isActive: true });
      const hotelIds = hotels.map((h) => h._id);
      const rooms = await Room.find({ hotelId: { $in: hotelIds }, isAvailable: true });
      const reviews = await Review.find({ hotelId: { $in: hotelIds } })
        .sort({ createdAt: -1 })
        .limit(200);

      // Group rooms and reviews by hotel
      const roomsByHotel = new Map();
      for (const r of rooms) {
        const hid = r.hotelId.toString();
        if (!roomsByHotel.has(hid)) roomsByHotel.set(hid, []);
        roomsByHotel.get(hid).push(r);
      }

      const reviewsByHotel = new Map();
      for (const rev of reviews) {
        const hid = rev.hotelId.toString();
        if (!reviewsByHotel.has(hid)) reviewsByHotel.set(hid, []);
        reviewsByHotel.get(hid).push(rev);
      }

      for (const h of hotels) {
        const hid = h._id.toString();
        const hotelRooms = roomsByHotel.get(hid) || [];
        const hotelReviews = reviewsByHotel.get(hid) || [];

        // Document A: Hotel Overview, Amenities & Location
        documents.push(
          new Document({
            pageContent:
              `Hotel: ${h.name}\n` +
              `City: ${h.city}, State: ${h.state || "N/A"}\n` +
              `Address: ${h.address}\n` +
              `Base Price: ₹${h.basePrice}/night\n` +
              `Average Rating: ${h.avgRating || "New"} (${h.totalReviews || 0} reviews)\n` +
              `Amenities: ${h.amenities?.join(", ") || "Standard amenities"}\n` +
              `Description: ${h.description || "Comfortable stay with premier hospitality."}\n` +
              `Nearby Landmarks: Located in prime ${h.city}, close to local transit, major temples, markets, and tourist points.`,
            metadata: {
              type: "hotel_overview",
              hotelId: hid,
              hotelName: h.name,
              city: h.city,
            },
          })
        );

        // Document B: Room Details & Configurations
        if (hotelRooms.length > 0) {
          const roomDescriptions = hotelRooms
            .map(
              (r) =>
                `• Room: ${r.title} (${r.roomType}) | Price: ₹${r.pricePerDay}/night | Max Guests: ${r.maxGuests} | Amenities: ${r.amenities?.join(", ") || "WiFi, TV, AC"}`
            )
            .join("\n");

          documents.push(
            new Document({
              pageContent:
                `Hotel: ${h.name} (${h.city})\n` +
                `Available Room Types and Pricing:\n${roomDescriptions}\n` +
                `Check-in Time: 12:00 PM | Check-out Time: 11:00 AM`,
              metadata: {
                type: "room_info",
                hotelId: hid,
                hotelName: h.name,
                city: h.city,
              },
            })
          );
        }

        // Document C: Verified Guest Reviews & Sentiment
        if (hotelReviews.length > 0) {
          const reviewHighlights = hotelReviews
            .slice(0, 5)
            .map((r) => `"${r.message}" (Rating: ${r.rating}/5)`)
            .join(" | ");

          documents.push(
            new Document({
              pageContent:
                `Hotel: ${h.name} (${h.city})\n` +
                `Guest Feedback & Review Highlights:\n${reviewHighlights}\n` +
                `Overall Guest Satisfaction: ${h.avgRating}/5 stars.`,
              metadata: {
                type: "hotel_reviews",
                hotelId: hid,
                hotelName: h.name,
              },
            })
          );
        }
      }
    } catch (dbErr) {
      console.error("[RAG] Error fetching hotel data for embeddings:", dbErr);
    }

    return documents;
  }

  /**
   * Initialize and index documents into Vector Store
   */
  async initializeRAG(forceReindex = false) {
    if (this.vectorStore && !forceReindex) return;
    if (this.isIndexing) return;

    this.isIndexing = true;
    const startTime = Date.now();

    try {
      const documents = await this.buildDocuments();
      const embeddings = getEmbeddings();

      this.vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
      this.lastIndexedAt = new Date();

      console.log(
        `✅ Hotel RAG initialized: ${documents.length} knowledge documents indexed in ${Date.now() - startTime}ms`
      );
    } catch (error) {
      console.error("[RAG] Initialization failed:", error);
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Query RAG with similarity search and optional metadata filter
   */
  async queryRAG(query, options = {}) {
    try {
      if (!this.vectorStore) {
        await this.initializeRAG();
      }
      if (!this.vectorStore) return null;

      const k = options.k || 3;
      const results = await this.vectorStore.similaritySearch(query, k);

      if (!results || results.length === 0) return null;

      // Filter by hotelId if specified in state context
      let filtered = results;
      if (options.hotelId) {
        const hotelMatches = results.filter(
          (doc) => doc.metadata?.hotelId === options.hotelId
        );
        if (hotelMatches.length > 0) {
          filtered = hotelMatches;
        }
      }

      return filtered.map((d) => d.pageContent).join("\n\n---\n\n");
    } catch (error) {
      console.error("[RAG] Search error:", error);
      return null;
    }
  }
}

export const hotelRagService = new HotelRagService();
