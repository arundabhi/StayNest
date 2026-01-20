
import { expireWaitlistEntries } from "../../controllers/waitlist.controllers";


export default async function handler(req, res) {
  try {
    console.log("⏳ Running waitlist expiry job (Vercel)");
    await expireWaitlistEntries();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Waitlist cron error:", error);
    res.status(500).json({ success: false });
  }
}