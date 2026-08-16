import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // NOT unique — this is the whole point of the redesign. A user
      // can hold many coupons across their lifetime; each is its own
      // document with its own status.
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // rule is optional: null means this was issued manually (e.g. an
    // admin comping a customer) rather than earned via a CouponRule.
    rule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CouponRule",
      default: null,
    },

    // Snapshotted from the rule at issuance time, not re-read from
    // the rule later. If a rule's terms change or the rule is
    // deleted after this coupon was issued, this coupon must keep
    // honoring what the user was actually promised.
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
      min: 0,
    },

    status: {
      type: String,
      enum: ["available", "used", "expired", "cancelled"],
      default: "available",
    },

    earnedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    usedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true },
);

couponSchema.index({ user: 1, status: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;