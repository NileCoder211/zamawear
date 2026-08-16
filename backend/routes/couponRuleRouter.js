import express from "express";
import {
  getCouponRules,
  createCouponRule,
  updateCouponRule,
  deleteCouponRule,
} from "../controllers/couponRuleController.js";
import { protectRoute, adminRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin-only end to end — unlike categories, these expose internal
// promo thresholds, so not made public by default. Change getCouponRules
// to a public route if you want an "our current promotions" page later.
router.get("/", protectRoute, adminRoute, getCouponRules);
router.post("/", protectRoute, adminRoute, createCouponRule);
router.put("/:id", protectRoute, adminRoute, updateCouponRule);
router.delete("/:id", protectRoute, adminRoute, deleteCouponRule);

export default router;