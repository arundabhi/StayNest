import 'dotenv/config';
import app from "./src/app.js";
import connectDb from "./src/db/index.js";
import './src/api/cron/cleanup.js'
import { hotelRagService } from "./src/ai/rag/hotelRag.service.js";

const port = process.env.PORT || 3000;

// Ensure DB is connected before processing requests in serverless
const startServer = async () => {
  try {
    await connectDb();
    
    // Only listen if not in serverless environment
    // Vercel handles the listening part
    if (process.env.VERCEL !== '1') {
      app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        hotelRagService.initializeRAG();
      });
    } else {
      // In Vercel, still initialize RAG if possible
      hotelRagService.initializeRAG().catch(err => console.error("RAG init failed", err));
    }
  } catch (err) {
    console.error("Initialization failed:", err);
  }
};

startServer();

// Export app for Vercel
export default app;
