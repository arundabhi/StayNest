
import {  autoCompleteBooking } from "../../controllers/booking.controllers.js";








export default async function handler(req, res) {
  try {
    console.log("✅ Running auto-complete bookings (Vercel)");
    await autoCompleteBooking();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Auto-complete cron error:", error);
    res.status(500).json({ success: false });
  }
}