
import { expireWaitlistEntries } from "../../controllers/waitlist.controllers";


cron.schedule("0 * * * *", async () => {
  console.log("⏳ Running waitlist expiry job...");
  await expireWaitlistEntries();
});