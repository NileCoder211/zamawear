import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import Subcategory from "../models/subcategoryModel.js";

const MAX_LIMIT = 48;
const DEFAULT_LIMIT = 12;

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  return { page, limit };
}

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).populate("category subCategory", "name slug");
    res.json({ products });
  } catch (error) {
    console.error("Error in getAllProducts controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category subCategory",
      "name slug",
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error in getProductById controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }

    featuredProducts = await Product.find({ isFeatured: true })
      .populate("category subCategory", "name slug")
      .lean();

    if (!featuredProducts || featuredProducts.length === 0) {
      return res.status(404).json({ message: "No featured products found" });
    }

    await redis.set("featured_products", JSON.stringify(featuredProducts));

    res.json(featuredProducts);
  } catch (error) {
    console.error("Error in getFeaturedProducts controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Replaces the existing createProduct export in productController.js —
// swap this in for the old version. Everything else in that file
// (getAllProducts, getProductById, deleteProduct, etc.) is unchanged.

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, images, colors, subCategory, stock, sizes, brand } =
      req.body;

    // category is intentionally NOT accepted from the client — it's
    // derived automatically from subCategory in the model's
    // pre-validate hook, so the two can never be set inconsistently.
    if (!name || !description || !price || !subCategory) {
      return res.status(400).json({
        message: "name, description, price and subCategory are required",
      });
    }
    if (Number(price) <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    const subcatDoc = await Subcategory.findById(subCategory);
    if (!subcatDoc) {
      return res.status(400).json({ message: "Selected subcategory does not exist" });
    }

    const hasColors = Array.isArray(colors) && colors.length > 0;

    // Products either use per-color galleries (clothing — colors is
    // required, each with its own images) OR a single flat gallery
    // (e.g. Body Lotions & Creams — no colors, just `images`). Mixing
    // both on the same product isn't supported; pick one shape.
    if (!hasColors) {
      let normalizedImages = [];
      if (Array.isArray(images)) {
        normalizedImages = images.flat();
      } else if (typeof images === "string") {
        normalizedImages = [images];
      }

      if (normalizedImages.length === 0) {
        return res.status(400).json({
          message: "Provide at least one color with images, or at least one image",
        });
      }

      const results = await Promise.allSettled(
        normalizedImages.map((img) => cloudinary.uploader.upload(img, { folder: "products" })),
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        console.error(
          "Some images failed to upload:",
          failed.map((f) => f.reason),
        );
        return res.status(500).json({
          message: "One or more images failed to upload. Please try again.",
        });
      }

      const formattedImages = results.map((r) => ({
        url: r.value.secure_url,
        public_id: r.value.public_id,
      }));

      const product = await Product.create({
        name,
        description,
        price,
        images: formattedImages,
        colors: [],
        subCategory,
        stock: stock || 0,
        sizes: Array.isArray(sizes) ? sizes : undefined,
        brand,
      });

      if (product.stock === 0) {
        await redis.del("out_of_stock_products");
      }
      if (product.isFeatured) {
        await updateFeaturedProductsCache();
      }

      return res.status(201).json(product);
    }

    // ── Per-color upload path ────────────────────────────────────────────────
    for (const color of colors) {
      if (!color.name || !Array.isArray(color.images) || color.images.length === 0) {
        return res.status(400).json({
          message: "Each color needs a name and at least one image",
        });
      }
    }

    // Upload every color's images in parallel (across all colors at
    // once, not color-by-color), then re-slice the flat results back
    // into per-color groups using each color's image count — keeps
    // this to a single Promise.allSettled instead of nested loops of
    // sequential awaits.
    const uploadJobs = colors.flatMap((color) =>
      color.images.map((img) => cloudinary.uploader.upload(img, { folder: "products" })),
    );
    const uploadResults = await Promise.allSettled(uploadJobs);

    const failed = uploadResults.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error(
        "Some color images failed to upload:",
        failed.map((f) => f.reason),
      );
      return res.status(500).json({
        message: "One or more images failed to upload. Please try again.",
      });
    }

    let cursor = 0;
    const formattedColors = colors.map((color) => {
      const count = color.images.length;
      const slice = uploadResults.slice(cursor, cursor + count);
      cursor += count;

      return {
        name: color.name,
        hex: color.hex || undefined,
        images: slice.map((r) => ({
          url: r.value.secure_url,
          public_id: r.value.public_id,
        })),
        // Was missing entirely before — each color's own size run
        // (colors[i].sizes in the schema) needs to be carried through
        // from the request body the same way name/hex/images are, or
        // it silently never reaches the database even though the
        // frontend sends it correctly.
        sizes: Array.isArray(color.sizes) ? color.sizes : [],
      };
    });

    const product = await Product.create({
      name,
      description,
      price,
      images: [],
      colors: formattedColors,
      subCategory,
      stock: stock || 0,
      sizes: Array.isArray(sizes) ? sizes : undefined,
      brand,
    });

    if (product.stock === 0) {
      await redis.del("out_of_stock_products");
    }
    if (product.isFeatured) {
      await updateFeaturedProductsCache();
    }

    res.status(201).json(product);
  } catch (error) {
    console.error("Error in createProduct controller", error.message);
    // This is an admin-only endpoint, so surfacing the specific
    // validation message (e.g. "subcategory does not exist") is
    // useful for the admin UI rather than a leak — unlike
    // customer-facing routes, which should stay generic.
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    try {
      for (let img of product.images) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    } catch (error) {
      console.error("Error deleting images from Cloudinary:", error.message);
    }

    await Product.findByIdAndDelete(req.params.id);
    await updateFeaturedProductsCache();
    await redis.del("out_of_stock_products");

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProduct controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 4 } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          images: 1,
          price: 1,
          stock: 1,
        },
      },
    ]);

    res.json(products);
  } catch (error) {
    console.error("Error in getRecommendedProducts controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Category is a document, not a free-text string — look it up by
// slug (from the URL) rather than expecting a raw ObjectId there,
// since slugs are what your frontend routes/links actually use
// (e.g. /category/male, not /category/64f...).
//
// Paginated, and optionally scoped to a subcategory via
// ?subcategory=<slug> so the frontend can hit one endpoint for both
// "all products in category" and "one subcategory within it" without
// fetching everything up front.
export const getProductsByCategory = async (req, res) => {
  const { slug } = req.params;
  const { page, limit } = parsePagination(req.query);

  try {
    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const filter = { category: category._id };

    if (req.query.subcategory) {
      const subcategory = await Subcategory.findOne({
        slug: req.query.subcategory,
        category: category._id,
      });
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      filter.subCategory = subcategory._id;
    }

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .populate("subCategory", "name slug")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      category: { name: category.name, slug: category.slug },
      products,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalProducts / limit)),
      totalProducts,
    });
  } catch (error) {
    console.error("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Same pattern, one level deeper — e.g. /category/male/subcategory/shoes.
// Kept separate from getProductsByCategory for callers that already
// know both slugs and want a clean nested URL rather than a query param.
export const getProductsBySubcategory = async (req, res) => {
  const { categorySlug, subcategorySlug } = req.params;
  const { page, limit } = parsePagination(req.query);

  try {
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subcategory = await Subcategory.findOne({
      slug: subcategorySlug,
      category: category._id,
    });
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    const filter = { subCategory: subcategory._id };

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      category: { name: category.name, slug: category.slug },
      subcategory: { name: subcategory.name, slug: subcategory.slug },
      products,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalProducts / limit)),
      totalProducts,
    });
  } catch (error) {
    console.error("Error in getProductsBySubcategory controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Lightweight lookup used to build the subcategory filter pills on
// the frontend without pulling in any products — otherwise, once
// getProductsByCategory only returns one page at a time, the
// frontend has no reliable way to know every subcategory that
// exists under this category, only the ones on the current page.
export const getSubcategoriesForCategory = async (req, res) => {
  const { slug } = req.params;
  try {
    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subcategories = await Subcategory.find(
      { category: category._id },
      "name slug",
    ).sort({ name: 1 });

    res.json({
      category: { name: category.name, slug: category.slug },
      subcategories,
    });
  } catch (error) {
    console.error("Error in getSubcategoriesForCategory controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();
    await updateFeaturedProductsCache();

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error in toggleFeaturedProduct controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getOutOfStockProducts = async (req, res) => {
  try {
    let products = await redis.get("out_of_stock_products");

    if (products) {
      return res.json(JSON.parse(products));
    }

    products = await Product.find({ stock: 0 }).lean();

    await redis.set("out_of_stock_products", JSON.stringify(products));

    res.json(products);
  } catch (error) {
    console.error("Error in getOutOfStockProducts controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ message: "Invalid stock value" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.stock = stock;
    await product.save();

    await redis.del("out_of_stock_products");

    if (product.isFeatured) {
      await updateFeaturedProductsCache();
    }

    res.json(product);
  } catch (error) {
    console.error("Error in updateProductStock controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateFeaturedProductsCache = async () => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true })
      .populate("category subCategory", "name slug")
      .lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.error("Error updating featured products cache:", error.message);
  }
};