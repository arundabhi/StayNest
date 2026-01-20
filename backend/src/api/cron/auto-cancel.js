
import { autoCancelledPendingBooking } from "../../controllers/booking.controllers";


export default async function handler(req, res) {
  try {
    console.log("🔄 Running auto-cancel (Vercel Cron)");
    await autoCancelledPendingBooking();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Cron error:", error);
    res.status(500).json({ success: false });
  }
}


