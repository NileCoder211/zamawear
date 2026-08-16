import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subcategory name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// A slug only needs to be unique WITHIN its parent category, not
// globally — e.g. "shoes" can exist under both Male and Female
// without clashing. Two subcategories with the same name under the
// same category, however, should be rejected.
subcategorySchema.index({ category: 1, slug: 1 }, { unique: true });

subcategorySchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

export default Subcategory;