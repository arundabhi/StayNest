
import { autoPromoteWaitlist } from "../../controllers/waitlist.controllers";

export default async function handler(req, res) {
  try {
    console.log("🔁 Running auto waitlist promotion (Vercel)");
    await autoPromoteWaitlist();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Auto promote error:", error);
    res.status(500).json({ success: false });
  }
}