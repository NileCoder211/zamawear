import User from "../models/userModel.js";
import { redis } from "./redis.js";

export const GRACE_PERIOD_DAYS = 30;

// Anonymizes a user document in place and saves it. Called either
// when the grace period actually expires (accountDeletionJob.js) or
// immediately if you ever want to skip the grace period for a given
// account (e.g. an admin-triggered removal).
//
// Keeps Order documents intact — they already store their own
// name/price/image snapshot from purchase time, so they stay
// readable without needing a live reference to this user's data.
export const anonymizeUser = async (user) => {
  user.name = "Deleted User";
  user.email = `deleted_${user._id}@deleted.local`;
  user.password = undefined;
  user.googleId = undefined;
  user.profilePicture = "";
  user.cartItems = [];
  user.wishlist = [];
  user.verified = false;
  user.pendingDeletion = false;
  user.deletionScheduledAt = null;
  user.deletedAt = new Date();
  await user.save();

  // Belt-and-suspenders: clear any lingering session. deleteAccount
  // already does this at request time, but this covers the case
  // where anonymizeUser is called directly (e.g. an admin action).
  await redis.del(`refresh_token:${user._id}`);
};

// Called on successful login. If the account has a deletion scheduled
// and the grace period hasn't passed yet, logging back in cancels it.
// If the grace period HAS passed but the cleanup job hasn't run yet
// (a small timing window), treat login as blocked rather than racing
// the job — the account is effectively already gone.
//
// Returns "cancelled" | "expired" | "not_pending".
export const checkAndCancelPendingDeletion = async (user) => {
  if (!user.pendingDeletion) return "not_pending";

  if (user.deletionScheduledAt && user.deletionScheduledAt.getTime() <= Date.now()) {
    return "expired";
  }

  user.pendingDeletion = false;
  user.deletionScheduledAt = null;
  await user.save();
  return "cancelled";
};

// Run by the scheduled job (see jobs/accountDeletionJob.js). Finds
// every account whose grace period has passed and permanently
// anonymizes it. Processes one at a time so a failure on one user's
// document doesn't abort the rest.
export const processScheduledDeletions = async () => {
  const dueUsers = await User.find({
    pendingDeletion: true,
    deletionScheduledAt: { $lte: new Date() },
    deletedAt: null,
  });

  let processed = 0;
  for (const user of dueUsers) {
    try {
      await anonymizeUser(user);
      processed++;
    } catch (error) {
      console.error(`Failed to anonymize user ${user._id}:`, error.message);
    }
  }

  if (dueUsers.length > 0) {
    console.log(`Account deletion cleanup: anonymized ${processed}/${dueUsers.length} account(s)`);
  }

  return processed;
};