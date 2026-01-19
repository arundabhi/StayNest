
import {  autoCompleteBooking } from "../../controllers/booking.controllers.js";








cron.schedule("0 * * * *", async () => {
  try {
    console.log("✅ Running auto-complete bookings...");
    await autoCompleteBooking();
  } catch (error) {
    console.error("❌ Auto-complete cron error:", error);
  }
});
