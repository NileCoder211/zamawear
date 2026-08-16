import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String, // e.g. Cloudinary URL, used for category tiles/banners
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true, // lets you hide a category without deleting it (and its products)
    },
  },
  { timestamps: true },
);

// Auto-generate slug from name if one wasn't provided.
categorySchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

const Category = mongoose.model("Category", categorySchema);

export default Category;