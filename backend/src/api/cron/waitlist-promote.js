
import { autoPromoteWaitlist } from "../../controllers/waitlist.controllers";

cron.schedule("*/5 * * * *", async () => {
  console.log("🔁 Running auto waitlist promotion...");
  await autoPromoteWaitlist();
});


