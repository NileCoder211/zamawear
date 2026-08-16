import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import Subcategory from "../models/subcategoryModel.js";

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

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, images, subCategory, stock, sizes, colors, brand } =
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

    let normalizedImages = [];
    if (Array.isArray(images)) {
      normalizedImages = images.flat();
    } else if (typeof images === "string") {
      normalizedImages = [images];
    }

    if (normalizedImages.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
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
      subCategory,
      stock: stock || 0,
      sizes: Array.isArray(sizes) ? sizes : undefined,
      colors: Array.isArray(colors) ? colors : undefined,
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

// Category is now a document, not a free-text string — look it up by
// slug (from the URL) rather than expecting a raw ObjectId there,
// since slugs are what your frontend routes/links will actually use
// (e.g. /category/male, not /category/64f...).
export const getProductsByCategory = async (req, res) => {
  const { slug } = req.params;
  try {
    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const products = await Product.find({ category: category._id }).populate(
      "subCategory",
      "name slug",
    );

    res.json({ category: { name: category.name, slug: category.slug }, products });
  } catch (error) {
    console.error("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Same pattern, one level deeper — e.g. /category/male/subcategory/shoes
export const getProductsBySubcategory = async (req, res) => {
  const { categorySlug, subcategorySlug } = req.params;
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

    const products = await Product.find({ subCategory: subcategory._id });

    res.json({
      category: { name: category.name, slug: category.slug },
      subcategory: { name: subcategory.name, slug: subcategory.slug },
      products,
    });
  } catch (error) {
    console.error("Error in getProductsBySubcategory controller", error.message);
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

async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true })
      .populate("category subCategory", "name slug")
      .lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.error("Error updating featured products cache:", error.message);
  }
}