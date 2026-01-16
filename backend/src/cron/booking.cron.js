import cron from "node-cron";
import { autoCancelledPendingBooking, autoCompleteBooking } from "../controllers/booking.controllers.js";
import { autoPromoteWaitlist, expireWaitlistEntries } from "../controllers/waitlist.controllers.js";



cron.schedule("*/15 * * * *", async () => { 
  console.log("🔄 Running auto-cancel pending bookings...");
  await autoCancelledPendingBooking();
});


cron.schedule("*/15 * * * *", async () => {
  try {
    console.log("🔄 Running auto-cancel...");
    await autoCancelledPendingBooking();
  } catch (error) {
    console.error("❌ Cron error:", error);
  }
});



cron.schedule("*/5 * * * *", async () => {
  console.log("🔁 Running auto waitlist promotion...");
  await autoPromoteWaitlist();
});


cron.schedule("0 * * * *", async () => {
  console.log("⏳ Running waitlist expiry job...");
  await expireWaitlistEntries();
});