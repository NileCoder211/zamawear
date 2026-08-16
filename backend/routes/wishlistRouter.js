import express from "express";
import {getWishlist, toggleWishlist} from "../controllers/wishlistController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protectRoute, getWishlist);
router.post("/:productId", protectRoute, toggleWishlist);

export default router;
