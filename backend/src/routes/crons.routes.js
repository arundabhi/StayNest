import express from "express";
import { autoCompleteBooking } from "../controllers/booking.controllers.js";

const router = express.Router();

router.get("/auto-complete", async (req, res) => {
  try {
    console.log("✅ Running auto-complete bookings");
    await autoCompleteBooking();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Auto-complete error:", error);
    res.status(500).json({ success: false });
  }
});

export default router;
