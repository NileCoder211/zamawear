import Category from "../models/categoryModel.js";
import Subcategory from "../models/subcategoryModel.js";

// Public — storefront navigation. Admin panel can pass
// ?includeInactive=true to also see disabled categories for management.
export const getCategories = async (req, res) => {
  try {
    const filter =
      req.query.includeInactive === "true" ? {} : { isActive: true };
    const categories = await Category.find(filter).sort("name");
    res.json({ categories });
  } catch (error) {
    console.error("Error in getCategories controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, image, slug } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await Category.create({ name, image, slug });
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "A category with that name/slug already exists" });
    }
    console.error("Error in createCategory controller", error.message);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const { name, image, slug, isActive } = req.body;
    if (name !== undefined) category.name = name;
    if (image !== undefined) category.image = image;
    if (slug !== undefined) category.slug = slug; // explicit override — auto-slug only fires when slug is unset
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "A category with that name/slug already exists" });
    }
    console.error("Error in updateCategory controller", error.message);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Block deletion if subcategories still reference this category —
    // deleting it out from under them would orphan every product in
    // those subcategories (Product.category would point at nothing).
    const subcatCount = await Subcategory.countDocuments({
      category: category._id,
    });
    if (subcatCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${subcatCount} subcategor${subcatCount === 1 ? "y" : "ies"} still belong to this category. Delete or reassign them first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCategory controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({
      slug,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.status(200).json({
      category,
    });
  } catch (error) {
    console.error("Get category by slug error:", error);

    res.status(500).json({
      message: "Failed to fetch category",
    });
  }
};