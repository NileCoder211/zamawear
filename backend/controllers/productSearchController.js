import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js"; // adjust filename if yours differs
import Subcategory from "../models/subcategoryModel.js";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function emptyResult(page, limit) {
  return {
    products: [],
    pagination: { page: Number(page), limit: Number(limit), total: 0, totalPages: 0 },
    query: {},
  };
}

// GET /api/products/search
//   ?q=black+dress&category=women&subCategory=dresses&color=black&size=M
//   &minPrice=20&maxPrice=100&sort=relevance&page=1&limit=24
//
// `category` and `subCategory` are expected as SLUGS (whatever your nav
// links already use), since the schema stores them as ObjectId refs.
export const searchProducts = async (req, res) => {
  try {
    const {
      q,
      category,
      subCategory,
      color,
      size,
      minPrice,
      maxPrice,
      sort = "relevance",
      page = 1,
      limit = 24,
    } = req.query;

    // Never surface unpublished products (isActive: false) in search.
    const filter = { isActive: true };

    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
    }

    let categoryId = null;

    if (category) {
      const cat = await Category.findOne({ slug: category.toLowerCase(), isActive: true }).select("_id");
      if (!cat) return res.json(emptyResult(page, limit));
      categoryId = cat._id;
      filter.category = categoryId;
    }

    if (subCategory) {
      // Subcategory slugs are only unique WITHIN a category (e.g. "shoes"
      // exists under both Men and Women), so:
      //  - if `category` was also given, resolve the one exact doc under it
      //  - if not, a slug can match several subcategories across
      //    different categories, so we match against all of their ids
      if (categoryId) {
        const subcat = await Subcategory.findOne({
          category: categoryId,
          slug: subCategory.toLowerCase(),
          isActive: true,
        }).select("_id");
        if (!subcat) return res.json(emptyResult(page, limit));
        filter.subCategory = subcat._id;
      } else {
        const subcats = await Subcategory.find({
          slug: subCategory.toLowerCase(),
          isActive: true,
        }).select("_id");
        if (subcats.length === 0) return res.json(emptyResult(page, limit));
        filter.subCategory = { $in: subcats.map((s) => s._id) };
      }
    }

    if (color) filter["colors.name"] = new RegExp(`^${escapeRegex(color)}$`, "i");
    if (size) filter.sizes = new RegExp(`^${escapeRegex(size)}$`, "i");

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortStage = {};
    let projection = {};

    if (q && q.trim() && sort === "relevance") {
      // Sorting by textScore requires it in the projection too.
      projection = { score: { $meta: "textScore" } };
      sortStage = { score: { $meta: "textScore" } };
    } else {
      switch (sort) {
        case "price_asc":
          sortStage = { price: 1 };
          break;
        case "price_desc":
          sortStage = { price: -1 };
          break;
        case "newest":
          sortStage = { createdAt: -1 };
          break;
        default:
          sortStage = { createdAt: -1 };
      }
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(60, Math.max(1, Number(limit))); // hard ceiling to protect the DB
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(filter, projection)
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .sort(sortStage)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      query: { q: q || null, category, subCategory, color, size, minPrice, maxPrice, sort },
    });
  } catch (err) {
    console.error("searchProducts error:", err);
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};

// GET /api/products/search/suggestions?q=bla
// Lightweight typeahead: prefix/substring match on `name` only, small
// payload, meant to be called on every debounced keystroke - a
// different query shape from the full search above, since $text
// doesn't do partial-word matching.
export const suggestProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim() || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const regex = new RegExp(escapeRegex(q.trim()), "i");

    const suggestions = await Product.find(
      { name: regex, isActive: true },
      { name: 1, slug: 1, price: 1, images: { $slice: 1 }, colors: { $slice: 1 } }
    )
      .limit(6)
      .lean();

    res.json({
      suggestions: suggestions.map((p) => ({
        id: p._id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        // colors[0].images take over whenever colors exist; `images` is
        // the fallback gallery for variant-less products (e.g. creams).
        image: p.colors?.[0]?.images?.[0]?.url || p.images?.[0]?.url || null,
      })),
    });
  } catch (err) {
    console.error("suggestProducts error:", err);
    res.status(500).json({ message: "Suggestion lookup failed", error: err.message });
  }
};