import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getFeaturedProducts,
  getProductsByCategory,
  getProductsBySubcategory,
  getSubcategoriesForCategory,
  getRecommendedProducts,
  toggleFeaturedProduct,
  getOutOfStockProducts,
  updateProductStock,
} from "../controllers/productController.js";
import { searchProducts, suggestProducts } from "../controllers/productSearchController.js";
import { adminRoute, protectRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public — storefront browsing. Literal paths registered BEFORE
// "/:id" so Express doesn't swallow them as an id param.
router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/recommendations", getRecommendedProducts);
router.get("/category/:slug/subcategories", getSubcategoriesForCategory);
router.get("/category/:slug", getProductsByCategory);
router.get(
  "/category/:categorySlug/subcategory/:subcategorySlug",
  getProductsBySubcategory,
);

router.get("/search/suggestions", suggestProducts);
router.get("/search", searchProducts);

// Admin-only — literal paths, still before "/:id"
router.get("/out-of-stock", protectRoute, adminRoute, getOutOfStockProducts);
router.post("/", protectRoute, adminRoute, createProduct);

// "/:id" and anything nested under it come last, since it matches
// almost anything.
router.get("/:id", getProductById);
router.patch(
  "/:id/toggle-featured",
  protectRoute,
  adminRoute,
  toggleFeaturedProduct,
);
router.patch("/:id/stock", protectRoute, adminRoute, updateProductStock);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default router;
