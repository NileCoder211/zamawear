import express from "express";
import {
  getUserOrders,
  getSingleOrder,
  updateOrderStatus,
  deleteOrder,
  getAllOrders,
  cancelOrder,
} from "../controllers/orderController.js";
import { protectRoute, adminRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Specific routes FIRST (before any /:id routes) ───────────────────────────
router.get("/my-orders", protectRoute, getUserOrders);
router.get("/all", protectRoute, adminRoute, getAllOrders);

// ── Param routes LAST ─────────────────────────────────────────────────────────
router.get("/:id", protectRoute, getSingleOrder);
router.patch("/:id/cancel", protectRoute, cancelOrder);
router.patch("/:id/status", protectRoute, adminRoute, updateOrderStatus);
router.delete("/:id", protectRoute, adminRoute, deleteOrder);

export default router;