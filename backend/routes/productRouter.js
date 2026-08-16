import express from "express";
import {
	createProduct,
	updateProduct,
	deleteProduct,
	getAllProducts,
	getProductById,
	getFeaturedProducts,
	getProductsByCategory,
	getProductsBySubcategory,
	getRecommendedProducts,
	toggleFeaturedProduct,
	getOutOfStockProducts,
	updateProductStock
} from "../controllers/productController.js";
import { adminRoute, protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public — storefront browsing. Literal paths registered BEFORE
// "/:id" so Express doesn't swallow them as an id param.
router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/recommendations", getRecommendedProducts);
router.get("/category/:slug", getProductsByCategory);
router.get("/category/:categorySlug/subcategory/:subcategorySlug", getProductsBySubcategory);

// Admin-only — literal paths, still before "/:id"
router.get("/out-of-stock", protectRoute, adminRoute, getOutOfStockProducts);
router.post("/", protectRoute, adminRoute, createProduct);

// "/:id" and anything nested under it come last, since it matches
// almost anything.
router.get("/:id", getProductById);
router.put("/:id", protectRoute, adminRoute, updateProduct);
router.patch("/:id/toggle-featured", protectRoute, adminRoute, toggleFeaturedProduct);
router.patch("/:id/stock", protectRoute, adminRoute, updateProductStock);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default router;