import cron from "node-cron";
import { autoCancelledPendingBooking, autoCompleteBooking } from "../controllers/booking.controllers.js";
import { autoPromoteWaitlist, expireWaitlistEntries } from "../controllers/waitlist.controllers.js";



cron.schedule("*/5 * * * *", () => {
  autoCancelledPendingBooking();
});


cron.schedule("10 0 * * *", async () => {
  console.log("Running auto-complete booking job...");
  await autoCompleteBooking();
});




cron.schedule("*/5 * * * *", async () => {
  console.log("🔁 Running auto waitlist promotion...");
  await autoPromoteWaitlist();
});


cron.schedule("0 * * * *", async () => {
  console.log("⏳ Running waitlist expiry job...");
  await expireWaitlistEntries();
});