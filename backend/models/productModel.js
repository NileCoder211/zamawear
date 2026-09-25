import mongoose from "mongoose";
import Subcategory from "./subCategoryModel.js";

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
    // Fallback gallery for products with no color variants (e.g. Body
    // Lotions & Creams). Ignored on the frontend whenever `colors` is
    // non-empty — colors[].images take over as the per-color gallery.
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
    // Fallback size run — ONLY used when the product has no color
    // variants (colors.length === 0), e.g. a cream sold in 100ml/200ml.
    // Once a product has colors, size selection moves to colors[].sizes
    // below instead, since different colors of the same product can
    // legitimately carry different size runs (e.g. red comes in
    // S/M/L/XL while white only comes in S/M).
    sizes: [{ type: String }],

    // Each color owns its own image gallery AND its own size run, so
    // selecting a color on the frontend swaps both the displayed photos
    // and the available sizes. `hex` is optional — the frontend falls
    // back to a neutral swatch color when it's missing (e.g. for a
    // colorway named something a simple hex can't represent well).
    colors: [
      {
        name: { type: String, required: true, trim: true },
        hex: { type: String, trim: true },
        images: [
          {
            url: { type: String, required: true },
            public_id: { type: String },
          },
        ],
        sizes: [{ type: String }],
      },
    ],

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
  },
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


/**
 * models/productModel.js already has:
 *   productSchema.index({ name: "text", description: "text" });
 *
 * REPLACE that one line with the weighted version below - a collection
 * can only have ONE text index, so this is a replace, not an addition.
 * If Mongo complains the index already exists with different options,
 * drop the old one first:
 *
 *   db.products.dropIndex("name_text_description_text")
 *
 * (category/subCategory are ObjectId refs now, not strings, so they
 * can't be part of a text index - filtering on them happens in the
 * controller's $match stage instead, via the existing
 * `category: 1` / `subCategory: 1` indexes you already have.)
 */
productSchema.index(
  { name: "text", description: "text", brand: "text" },
  {
    weights: { name: 10, brand: 4, description: 1 },
    name: "ProductTextIndex",
  }
);

// Speeds up the color/size filter stage when there's no text query at
// all (e.g. browsing a subcategory with just filters applied).
// `sizes` covers colorless (fallback) products; `colors.sizes` covers
// products where the size run is scoped to a specific color.
productSchema.index({ "colors.name": 1 });
productSchema.index({ sizes: 1 });
productSchema.index({ "colors.sizes": 1 });


const Product = mongoose.model("Product", productSchema);

export default Product;
