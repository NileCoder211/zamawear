import Product from "../models/productModel.js";
import User from "../models/userModel.js";


// Two cart lines are only "the same" when productId, color, AND size
// all match — this is what lets the same product appear as two
// independent lines (e.g. Black/M and White/L of the same shirt).
// null (not undefined) means "no variant" so Mongo's equality checks
// behave the same whether the product has variants or not.
const normalizeVariant = (value) => value ?? null;

// ─────────────────────────────────────────────────────────────
// GET CART PRODUCTS
// ─────────────────────────────────────────────────────────────
export const getCartProducts = async (req, res) => {
  try {
    const productIds = req.user.cartItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // One entry PER CART LINE, not deduped by productId — two lines
    // can reference the same product with different color/size, and
    // each keeps its own cart-item _id (cartItemId) so the frontend
    // can update/remove the right one specifically.
    const cartItems = req.user.cartItems
      .map((item) => {
        const product = productMap.get(item.productId.toString());
        if (!product) return null; // product was deleted since being added
        return {
          ...product.toJSON(),
          cartItemId: item._id,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
        };
      })
      .filter(Boolean);

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
    const { productId, color, size } = req.body;

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

    const normColor = normalizeVariant(color);
    const normSize = normalizeVariant(size);

    // Try to increment an existing line item — same productId AND
    // color AND size — atomically first...
    const incremented = await User.updateOne(
      {
        _id: req.user._id,
        cartItems: {
          $elemMatch: { productId, color: normColor, size: normSize },
        },
      },
      { $inc: { "cartItems.$.quantity": 1 } },
    );

    // ...only push a new line if there wasn't a matching one to
    // increment. Same race-avoidance reasoning as before: doing this
    // as increment-then-conditional-push (rather than read-then-
    // decide-then-write) avoids two rapid "add to cart" clicks both
    // seeing "no match" and both pushing duplicate lines.
    if (incremented.matchedCount === 0) {
      await User.updateOne(
        { _id: req.user._id },
        {
          $push: {
            cartItems: {
              productId,
              quantity: 1,
              color: normColor,
              size: normSize,
            },
          },
        },
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
// Keyed by the cart LINE's own _id now, not productId — productId
// alone can no longer identify a single line once the same product
// can appear multiple times with different color/size.
// ─────────────────────────────────────────────────────────────
export const removeFromCart = async (req, res) => {
  try {
    const cartItemId = req.params.id;

    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { cartItems: { _id: cartItemId } } },
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
// Also keyed by cart-line _id now, same reasoning as removeFromCart.
// ─────────────────────────────────────────────────────────────
export const updateQuantity = async (req, res) => {
  try {
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    if (quantity === undefined || !Number.isInteger(quantity) || quantity < 0) {
      return res
        .status(400)
        .json({ message: "quantity must be a non-negative integer" });
    }

    const user = await User.findById(req.user._id);
    const cartItem = user.cartItems.id(cartItemId);

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (quantity === 0) {
      user.cartItems = user.cartItems.filter(
        (item) => item._id.toString() !== cartItemId,
      );
      await user.save();
      return res.json(user.cartItems);
    }

    const product = await Product.findById(cartItem.productId);
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
// CLEAR CART
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
