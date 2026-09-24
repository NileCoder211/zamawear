import express from "express";
import { getMyCoupons, getAvailableCoupons, validateCoupon } from "../controllers/couponController.js";
import { protectRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protectRoute, getMyCoupons);
router.get("/available", protectRoute, getAvailableCoupons);
router.post("/validate", protectRoute, validateCoupon);

export default router;