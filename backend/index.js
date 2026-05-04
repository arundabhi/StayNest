import 'dotenv/config';
import app from "./src/app.js";
import connectDb from "./src/db/index.js";
import './src/api/cron/cleanup.js'
import { initRAG } from "./src/ai/rag.js";

const port = process.env.PORT || 3000;

console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
console.log("STRIPE_SECRET_KEY present:", !!process.env.STRIPE_SECRET_KEY);

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
      // Initialize RAG system after server starts and DB is connected
      initRAG();
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed !!! ", err);
  });
