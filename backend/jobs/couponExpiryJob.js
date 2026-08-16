import cron from "node-cron";
import Coupon from "../models/couponModel.js";

// Bulk sweep — the lazy per-request check in getValidCoupon handles
// the gap between a coupon actually expiring and this job's next
// run, so this isn't the only thing standing between an expired
// coupon and it being rejected; it just keeps the stored status
// accurate for listing/display purposes (e.g. "my coupons" showing
// the right status without the user having tried to use it first).
export const sweepExpiredCoupons = async () => {
  const result = await Coupon.updateMany(
    { status: "available", expiresAt: { $lte: new Date() } },
    { $set: { status: "expired" } },
  );

  if (result.modifiedCount > 0) {
    console.log(`Coupon expiry sweep: marked ${result.modifiedCount} coupon(s) expired`);
  }

  return result.modifiedCount;
};

// Runs daily at 03:30 — offset slightly from the account-deletion job
// (03:00) so they don't contend for DB resources at exactly the same
// moment. Call this once from server.js after the DB connection is
// established, same as startAccountDeletionJob.
export const startCouponExpiryJob = () => {
  cron.schedule("30 3 * * *", async () => {
    try {
      await sweepExpiredCoupons();
    } catch (error) {
      console.error("Coupon expiry sweep job failed:", error.message);
    }
  });

  console.log("Coupon expiry sweep job scheduled (daily at 03:30)");
};