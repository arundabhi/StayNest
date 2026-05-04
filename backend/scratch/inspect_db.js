// scratch/inspect_db.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model("Booking", BookingSchema);

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");

    const bookings = await Booking.find({}).limit(10);
    console.log(`Found ${bookings.length} total bookings.`);
    
    bookings.forEach((b, i) => {
      console.log(`\n[Booking ${i+1}]`);
      console.log(`ID: ${b._id}`);
      console.log(`User: ${b.userId}`);
      console.log(`Check-in: ${b.checkIn}`);
      console.log(`Check-out: ${b.checkOut}`);
      console.log(`Status: ${b.status}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
