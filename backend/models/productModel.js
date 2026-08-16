import mongoose from "mongoose";
import Subcategory from "./subcategoryModel.js";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    // ── Pricing (KES) ────────────────────────────────────────────────────────
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    // ── Media ────────────────────────────────────────────────────────────────
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String },
      },
    ],
    // ── Categorisation ───────────────────────────────────────────────────────
    // subCategory is the one you actually set; category is derived
    // automatically from it (see pre-validate hook below) so the two
    // can never disagree with each other.
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },
    // Optional, mainly relevant to clothing (Male/Female/Children) —
    // harmless/unused for Body Lotions & Creams products.
    sizes: [{ type: String }],
    colors: [{ type: String }],
    brand: { type: String, trim: true },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true, // unpublish without deleting — preserves order history references
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Runs BEFORE validation (not pre-save) — required-field validation on
// `category` would otherwise fail before this ever gets a chance to
// set it.
productSchema.pre("validate", async function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  if (this.isModified("subCategory") || this.isNew) {
    const subcat = await Subcategory.findById(this.subCategory);
    if (!subcat) {
      throw new Error("Selected subcategory does not exist");
    }
    this.category = subcat.category;
  }
});

productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: "text", description: "text" });

const Product = mongoose.model("Product", productSchema);

export default Product;