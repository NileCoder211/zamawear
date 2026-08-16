import Product from "../models/productModel.js";
import User from "../models/userModel.js";

// ─────────────────────────────────────────────────────────────
// GET CART PRODUCTS
// ─────────────────────────────────────────────────────────────
export const getCartProducts = async (req, res) => {
  try {
    const products = await Product.find({
      _id: { $in: req.user.cartItems.map((item) => item.productId) },
    });

    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (cartItem) => cartItem.productId.toString() === product._id.toString()
      );

      return { ...product.toJSON(), quantity: item ? item.quantity : 1 };
    });

    res.json(cartItems);
  } catch (error) {
    console.error("Error in getCartProducts controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// ADD TO CART
// ─────────────────────────────────────────────────────────────
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ message: "This product is out of stock" });
    }

    // Try to increment an existing line item atomically first...
    const incremented = await User.updateOne(
      { _id: req.user._id, "cartItems.productId": productId },
      { $inc: { "cartItems.$.quantity": 1 } },
    );

    // ...only push a new line item if there wasn't one to increment.
    // Doing it this way (rather than read-then-decide-then-write)
    // avoids a race where two rapid "add to cart" clicks both see
    // "no existing item" and both push, creating a duplicate entry.
    if (incremented.matchedCount === 0) {
      await User.updateOne(
        { _id: req.user._id },
        { $push: { cartItems: { productId, quantity: 1 } } },
      );
    }

    const updatedUser = await User.findById(req.user._id);
    res.json(updatedUser.cartItems);
  } catch (error) {
    console.error("Error in addToCart controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// REMOVE ONE ITEM FROM CART
// ─────────────────────────────────────────────────────────────
export const removeFromCart = async (req, res) => {
  try {
    const productId = req.params.id;

    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { cartItems: { productId } } },
      { returnDocument: "after" },
    );

    const updatedUser = await User.findById(req.user._id);
    res.json(updatedUser.cartItems);
  } catch (error) {
    console.error("Error in removeFromCart controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE QUANTITY
// ─────────────────────────────────────────────────────────────
export const updateQuantity = async (req, res) => {
  try {
    const productId = req.params.id;
    const { quantity } = req.body;

    if (quantity === undefined || !Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ message: "quantity must be a non-negative integer" });
    }

    const user = await User.findById(req.user._id);
    const cartItem = user.cartItems.find(
      (item) => item.productId.toString() === String(productId),
    );

    if (!cartItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    if (quantity === 0) {
      user.cartItems = user.cartItems.filter(
        (item) => item.productId.toString() !== String(productId),
      );
      await user.save();
      return res.json(user.cartItems);
    }

    const product = await Product.findById(productId);
    if (product && quantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} in stock`,
      });
    }

    cartItem.quantity = quantity;
    await user.save();

    res.json(user.cartItems);
  } catch (error) {
    console.error("Error in updateQuantity controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// CLEAR CART (the only "wipe everything" path — removeFromCart no
// longer doubles as this)
// ─────────────────────────────────────────────────────────────
export const clearCart = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { cartItems: [] } },
      { returnDocument: "after" },
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error in clearCart controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};