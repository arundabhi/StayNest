import mongoose from "mongoose";
import dotenv from "dotenv";
import { Booking } from "../src/models/booking.models.js";
import { User } from "../src/models/user.models.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to database.");

    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(5);
    console.log("Recent Bookings:");
    for (const b of bookings) {
      console.log(`Booking ID: ${b._id}`);
      console.log(`  User ID on Booking: ${b.userId}`);
      console.log(`  Payment Mode: ${b.paymentMode}`);
      console.log(`  Payment Status: ${b.paymentStatus}`);
      console.log(`  Status: ${b.status}`);
      console.log(`  Total Price: ${b.totalPrice}`);
      console.log(`  Created At: ${b.createdAt}`);
    }

    const users = await User.find().limit(5);
    console.log("\nUsers:");
    for (const u of users) {
      console.log(`User ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
  }
}

run();
