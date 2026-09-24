import User from "../models/userModel.js";
import Product from "../models/productModel.js";

// GET /api/wishlist
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "wishlist",
      "name price images category stock colors sizes isFeatured brand description",
    );

    // Mongoose leaves a null slot in a populated array when the
    // referenced doc no longer exists (product deleted after being
    // wishlisted) — filter those out so the frontend never has to
    // handle a null product, same as getCartProducts already does
    // for cart lines.
    const wishlist = (user.wishlist || []).filter(Boolean);

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error in getWishlist controller", error.message);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};

// POST /api/wishlist/:productId — toggle like/unlike
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const user = await User.findById(req.user._id);

    // Compare as strings — user.wishlist holds ObjectId objects, and
    // Array.includes() on those against a plain string productId
    // would always be false (strict equality never matches an
    // ObjectId object to a string), meaning "already liked" could
    // never be detected and unlike would never work.
    const isLiked = user.wishlist.some((id) => id.toString() === productId);

    if (isLiked) {
      user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();

    res.status(200).json({
      liked: !isLiked,
      wishlistCount: user.wishlist.length,
    });
  } catch (error) {
    console.error("Error in toggleWishlist controller", error.message);
    res.status(500).json({ message: "Failed to update wishlist" });
  }
};
