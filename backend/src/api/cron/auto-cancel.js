
import { autoCancelledPendingBooking } from "../../controllers/booking.controllers";


cron.schedule("*/15 * * * *", async () => {
  try {
    console.log("🔄 Running auto-cancel...");
    await autoCancelledPendingBooking();
  } catch (error) {
    console.error("❌ Cron error:", error);
  }
});



