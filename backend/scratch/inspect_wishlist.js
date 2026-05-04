// scratch/inspect_wishlist.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const WishlistSchema = new mongoose.Schema({}, { strict: false });
const Wishlist = mongoose.model("Wishlist", WishlistSchema);

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");

    const items = await Wishlist.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`Found ${items.length} recent wishlist items.`);
    
    items.forEach((item, i) => {
      console.log(`\n[Item ${i+1}]`);
      console.log(`ID: ${item._id}`);
      console.log(`User: ${item.userId}`);
      console.log(`Hotel: ${item.hotelId}`);
      console.log(`Room: ${item.roomId}`);
      console.log(`Created: ${item.createdAt}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
