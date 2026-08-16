import Coupon from "../models/couponModel.js";
import { getValidCoupon } from "../lib/coupons.js";

// GET /api/coupons — all of the user's coupons (any status), most
// recent first. Powers a "my rewards" / history view.
export const getMyCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (error) {
    console.error("Error in getMyCoupons controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/coupons/available — just the ones actually usable right
// now. Powers a checkout "apply a coupon" picker.
export const getAvailableCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      user: req.user._id,
      status: "available",
      expiresAt: { $gt: new Date() },
    }).sort({ expiresAt: 1 });
    res.json({ coupons });
  } catch (error) {
    console.error("Error in getAvailableCoupons controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/coupons/validate — check a code against a given order
// total and return the discount it would apply. Does NOT mark it
// used — that only happens once an order is actually placed
// (see markCouponUsed, called from mpesaController's stkPush/callback).
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;

    if (orderTotal === undefined || Number(orderTotal) < 0) {
      return res.status(400).json({ message: "A valid orderTotal is required" });
    }

    const result = await getValidCoupon(code, req.user._id, Number(orderTotal));

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    return res.json({
      message: "Coupon is valid",
      code: result.coupon.code,
      type: result.coupon.type,
      value: result.coupon.value,
      discount: result.discount,
    });
  } catch (error) {
    console.error("Error in validateCoupon controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};