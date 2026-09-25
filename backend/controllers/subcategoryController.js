import Subcategory from "../models/subCategoryModel.js";
import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";

// Public — storefront navigation. Optional ?category=<slug> to filter,
// ?includeInactive=true for admin management views.
export const getSubcategories = async (req, res) => {
  try {
    const filter =
      req.query.includeInactive === "true" ? {} : { isActive: true };

    if (req.query.category) {
      const category = await Category.findOne({ slug: req.query.category });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      filter.category = category._id;
    }

    const subcategories = await Subcategory.find(filter)
      .populate("category", "name slug")
      .sort("name");
    res.json({ subcategories });
  } catch (error) {
    console.error("Error in getSubcategories controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const createSubcategory = async (req, res) => {
  try {
    const { name, category, image, slug } = req.body;
    if (!name || !category) {
      return res
        .status(400)
        .json({ message: "name and category are required" });
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res
        .status(400)
        .json({ message: "Selected category does not exist" });
    }

    const subcategory = await Subcategory.create({
      name,
      category,
      image,
      slug,
    });
    res.status(201).json(subcategory);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({
          message:
            "A subcategory with that name already exists under this category",
        });
    }
    console.error("Error in createSubcategory controller", error.message);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    const { name, category, image, slug, isActive } = req.body;
    const categoryChanged =
      category !== undefined && category !== String(subcategory.category);

    if (categoryChanged) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res
          .status(400)
          .json({ message: "Selected category does not exist" });
      }
      subcategory.category = category;
    }

    if (name !== undefined) subcategory.name = name;
    if (image !== undefined) subcategory.image = image;
    if (slug !== undefined) subcategory.slug = slug;
    if (isActive !== undefined) subcategory.isActive = isActive;

    await subcategory.save();

    // Cascade: if this subcategory moved to a different category,
    // every existing product under it has a stale denormalized
    // `category` field (it was set once, at product-creation time,
    // and doesn't watch its subcategory for changes). Bring them all
    // in line now, rather than leaving them silently misfiled until
    // each product happens to get individually re-saved.
    if (categoryChanged) {
      const result = await Product.updateMany(
        { subCategory: subcategory._id },
        { category: subcategory.category },
      );
      if (result.modifiedCount > 0) {
        console.log(
          `Reassigned category for ${result.modifiedCount} product(s) under subcategory "${subcategory.name}"`,
        );
      }
    }

    res.json(subcategory);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({
          message:
            "A subcategory with that name already exists under this category",
        });
    }
    console.error("Error in updateSubcategory controller", error.message);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // Block deletion if products still reference it — Product.subCategory
    // is required, so deleting it out from under them would leave those
    // products pointing at nothing.
    const productCount = await Product.countDocuments({
      subCategory: subcategory._id,
    });
    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${productCount} product(s) still belong to this subcategory. Reassign or delete them first.`,
      });
    }

    await Subcategory.findByIdAndDelete(req.params.id);
    res.json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSubcategory controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
