import CouponRule from "../models/couponRuleModel.js";

// GET /api/coupon-rules — admin management view (all rules,
// active or not).
export const getCouponRules = async (req, res) => {
  try {
    const rules = await CouponRule.find({}).sort({ createdAt: -1 });
    res.json({ rules });
  } catch (error) {
    console.error("Error in getCouponRules controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const createCouponRule = async (req, res) => {
  try {
    const { name, type, value, minimumOrderAmount, maxDiscount, expiresAfterDays, combinable } =
      req.body;

    if (!name || !type || value === undefined || !expiresAfterDays) {
      return res.status(400).json({
        message: "name, type, value, and expiresAfterDays are required",
      });
    }

    const rule = await CouponRule.create({
      name,
      type,
      value,
      minimumOrderAmount,
      maxDiscount,
      expiresAfterDays,
      combinable,
    });

    res.status(201).json(rule);
  } catch (error) {
    console.error("Error in createCouponRule controller", error.message);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateCouponRule = async (req, res) => {
  try {
    const rule = await CouponRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: "Coupon rule not found" });
    }

    const { name, type, value, minimumOrderAmount, maxDiscount, expiresAfterDays, combinable, isActive } =
      req.body;

    if (name !== undefined) rule.name = name;
    if (type !== undefined) rule.type = type;
    if (value !== undefined) rule.value = value;
    if (minimumOrderAmount !== undefined) rule.minimumOrderAmount = minimumOrderAmount;
    if (maxDiscount !== undefined) rule.maxDiscount = maxDiscount;
    if (expiresAfterDays !== undefined) rule.expiresAfterDays = expiresAfterDays;
    if (combinable !== undefined) rule.combinable = combinable;
    if (isActive !== undefined) rule.isActive = isActive;

    // Editing a rule only affects coupons issued AFTER this save —
    // already-issued coupons keep the terms they were snapshotted
    // with at issuance time (see Coupon model).
    await rule.save();
    res.json(rule);
  } catch (error) {
    console.error("Error in updateCouponRule controller", error.message);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// Deactivate rather than hard-delete by default — issued coupons
// keep a `rule` reference, and deleting the rule document out from
// under them would break that link. Pass ?force=true to actually
// delete once no coupon references it.
export const deleteCouponRule = async (req, res) => {
  try {
    const rule = await CouponRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: "Coupon rule not found" });
    }

    if (req.query.force !== "true") {
      rule.isActive = false;
      await rule.save();
      return res.json({ message: "Coupon rule deactivated (not deleted — pass ?force=true to delete permanently)" });
    }

    await CouponRule.findByIdAndDelete(req.params.id);
    res.json({ message: "Coupon rule permanently deleted" });
  } catch (error) {
    console.error("Error in deleteCouponRule controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};