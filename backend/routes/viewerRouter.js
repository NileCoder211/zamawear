import express from "express";
import viewersController from "../controllers/viewerController.js";

const router = express.Router();

// Mount under /api/products in your main app:
// app.use("/api/products", viewersRoutes);

router.post("/:entityId/viewers/join", viewersController.join);
router.post("/:entityId/viewers/heartbeat", viewersController.heartbeat);
router.post("/:entityId/viewers/leave", viewersController.leave);
router.get("/:entityId/viewers", viewersController.getCount);

export default router;