import express from "express";
import { addToCart, getCartProducts, removeFromCart, updateQuantity,clearCart,} from "../controllers/cartController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute, addToCart);
router.put("/:id", protectRoute, updateQuantity);
router.delete("/:id", protectRoute, removeFromCart);
router.delete("/", protectRoute, clearCart);

export default router;