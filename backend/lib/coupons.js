import Coupon from "../models/couponModel.js";
import CouponRule from "../models/couponRuleModel.js";

// Generates a unique coupon code, retrying on collision — same
// pattern as generateOrderNumber.js. prefix defaults to "GIFT" to
// match the previous design; pass a different one if you want rule-
// specific prefixes later (e.g. "WELCOME", "VIP").
export const generateCouponCode = async (prefix = "GIFT") => {
  let code;
  let exists = true;

  while (exists) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    code = `${prefix}${random}`;
    exists = !!(await Coupon.findOne({ code }));
  }

  return code;
};

// Computes the discount amount (in KES) a coupon applies to a given
// order total. Does NOT check validity/expiry/minimum — call
// getValidCoupon first for that. Kept separate so a UI that already
// has a known-valid coupon object in hand can compute the number
// without a second DB round-trip.
export const computeDiscount = (coupon, orderTotal) => {
  if (coupon.type === "fixed") {
    return Math.min(coupon.value, orderTotal);
  }

  // percentage
  let discount = (orderTotal * coupon.value) / 100;
  if (coupon.maxDiscount != null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  return Math.min(discount, orderTotal);
};

// Looks up a coupon by code for a specific user and validates it:
// exists, still "available", not past its expiry (lazily flips it to
// "expired" and saves if it has — the cron job in
// couponExpiryJob.js does this in bulk on a schedule, but a request
// arriving in the gap between expiry and the next cron run should
// still see the correct status rather than a stale "available").
// Also checks the order total meets the coupon's minimum.
//
// Returns { coupon, discount } on success, or { error } on failure —
// deliberately not throwing, since "coupon invalid" is an expected,
// common outcome here, not an exceptional one.
export const getValidCoupon = async (code, userId, orderTotal) => {
  if (!code || typeof code !== "string") {
    return { error: "Coupon code is required" };
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), user: userId });

  if (!coupon) {
    return { error: "Coupon not found" };
  }

  if (coupon.status === "used") {
    return { error: "This coupon has already been used" };
  }
  if (coupon.status === "cancelled") {
    return { error: "This coupon is no longer valid" };
  }

  if (coupon.status === "available" && coupon.expiresAt < new Date()) {
    coupon.status = "expired";
    await coupon.save();
  }
  if (coupon.status === "expired") {
    return { error: "This coupon has expired" };
  }

  if (orderTotal < coupon.minimumOrderAmount) {
    return {
      error: `This coupon requires a minimum order of KES ${coupon.minimumOrderAmount}`,
    };
  }

  return { coupon, discount: computeDiscount(coupon, orderTotal) };
};

// Marks a coupon as redeemed against a specific order. Call this only
// after the order has actually been created/paid — not at
// validation time, since validation can happen speculatively (e.g.
// showing the discount in the cart before checkout completes).
export const markCouponUsed = async (coupon, orderId) => {
  coupon.status = "used";
  coupon.usedAt = new Date();
  coupon.usedOrder = orderId;
  await coupon.save();
};

// Finds the best currently-active CouponRule whose minimumOrderAmount
// the given order total qualifies for, and issues a new Coupon
// snapshotting that rule's terms. Returns the created coupon, or null
// if no rule applies. "Best" = highest value among qualifying rules —
// if you have both a 5% and a 10% rule a customer qualifies for, they
// get the 10% one, not whichever was queried first.
export const issueRewardCoupon = async (userId, orderTotal) => {
  const rule = await CouponRule.findOne({
    isActive: true,
    minimumOrderAmount: { $lte: orderTotal },
  }).sort({ value: -1 });

  if (!rule) return null;

  const code = await generateCouponCode();

  const coupon = await Coupon.create({
    user: userId,
    code,
    rule: rule._id,
    type: rule.type,
    value: rule.value,
    minimumOrderAmount: rule.minimumOrderAmount,
    maxDiscount: rule.maxDiscount,
    status: "available",
    expiresAt: new Date(Date.now() + rule.expiresAfterDays * 24 * 60 * 60 * 1000),
  });

  return coupon;
};