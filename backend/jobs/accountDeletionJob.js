import cron from "node-cron";
import { processScheduledDeletions } from "../lib/accountDeletion.js";

// Runs once a day at 03:00 server time — low-traffic hour, and daily
// is plenty given the grace period is measured in days, not hours.
// Import and call startAccountDeletionJob() once from server.js after
// your DB connection is established.
export const startAccountDeletionJob = () => {
  cron.schedule("0 3 * * *", async () => {
    try {
      await processScheduledDeletions();
    } catch (error) {
      console.error("Account deletion cleanup job failed:", error.message);
    }
  });

  console.log("Account deletion cleanup job scheduled (daily at 03:00)");
};