import mongoose from "mongoose";

const couponRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
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
    // Only meaningful for type "percentage" — caps the discount at a
    // flat KES amount even if the percentage would work out higher.
    maxDiscount: {
      type: Number,
      default: null,
      min: 0,
    },
    expiresAfterDays: {
      type: Number,
      required: true,
      min: 1,
    },
    // Stored per your spec, but not yet enforced anywhere — checkout
    // currently only supports one coupon per order (see stkPush).
    // Actually allowing multiple coupons to stack on one order is a
    // separate piece of work in the checkout flow itself.
    combinable: {
      type: Boolean,
      default: false,
    },
    // Turning a rule off stops NEW coupons being issued under it,
    // without invalidating coupons already issued under its terms
    // (those are snapshotted onto the Coupon at issuance time).
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

couponRuleSchema.pre("validate", function () {
  if (this.type === "percentage" && this.value > 100) {
    throw new Error("Percentage value cannot exceed 100");
  }
});

const CouponRule = mongoose.model("CouponRule", couponRuleSchema);

export default CouponRule;