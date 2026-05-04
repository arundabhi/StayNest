// scratch/find_recent_bookings.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model("Booking", BookingSchema);

async function find() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    
    const today = new Date("2026-04-27T00:00:00.000Z");
    console.log(`Searching for bookings around ${today.toISOString()}`);

    const bookings = await Booking.find({
      $or: [
        { checkIn: { $gte: today } },
        { checkOut: { $gte: today } }
      ]
    }).sort({ createdAt: -1 });

    console.log(`Found ${bookings.length} relevant bookings.`);
    
    bookings.forEach((b) => {
      console.log(`ID: ${b._id} | User: ${b.userId} | In: ${b.checkIn} | Out: ${b.checkOut} | Status: ${b.status}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

find();
