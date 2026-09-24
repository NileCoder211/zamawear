import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/my-orders
// ─────────────────────────────────────────────────────────────────────────────
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("products.product", "name images")
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("getUserOrders error:", error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getSingleOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("products.product", "name images");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("getSingleOrder error:", error);
    return res.status(500).json({ message: "Failed to fetch order" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/orders/:id/cancel  (user can cancel their own order)
// ─────────────────────────────────────────────────────────────────────────────
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // M-Pesa orders are only ever created AFTER payment succeeds
    // (see mpesaCallback), always starting life as "processing" —
    // "pending"/"paid" never actually occur as orderStatus values,
    // so checking against those meant no order could ever be
    // cancelled. "processing" is the only state a cancel makes sense
    // from; once shipped, it's too late.
    const cancellable = ["processing"];
    if (!cancellable.includes(order.orderStatus)) {
      return res.status(400).json({
        message: `Cannot cancel an order that is already ${order.orderStatus}`,
      });
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();

    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    await order.save();
    return res.status(200).json({ message: "Order cancelled", order });
  } catch (error) {
    console.error("cancelOrder error:", error);
    return res.status(500).json({ message: "Failed to cancel order" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/orders/:id/status  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const allowed = ["processing", "shipped", "delivered", "cancelled"];

    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Build one plain update object and merge into it, rather than
    // spreading a second $set alongside the first — two top-level
    // $set keys in the same object don't merge, the second silently
    // replaces the first. This only "worked" before because both
    // branches happened to duplicate orderStatus; it would have
    // silently dropped any other field added to the base $set later.
    const update = { orderStatus };
    if (orderStatus === "cancelled") {
      update.cancelledAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true },
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (orderStatus === "cancelled") {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    return res.status(500).json({ message: "Failed to update order" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/orders/:id  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.deleteOne();
    return res.status(200).json({ message: "Order deleted" });
  } catch (error) {
    console.error("deleteOrder error:", error);
    return res.status(500).json({ message: "Failed to delete order" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/all  (admin — all orders with pagination + analytics)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.orderStatus = req.query.status;

    if (req.query.search) {
      const s = req.query.search;
      query.$or = [
        { orderNumber: { $regex: s, $options: "i" } },
        { phoneNumber: { $regex: s, $options: "i" } },
      ];
    }

    const [orders, totalOrders, revenueData] = await Promise.all([
      Order.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
      Order.aggregate([
        {
          $match: { paymentStatus: "paid", orderStatus: { $ne: "cancelled" } },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Single payment method now, so no per-method split needed —
    // just the totals.
    const totalRevenue = revenueData[0]?.total || 0;
    const paidOrderCount = revenueData[0]?.count || 0;

    return res.status(200).json({
      orders,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
      },
      analytics: {
        totalRevenue,
        totalOrders,
        paidOrderCount,
      },
    });
  } catch (error) {
    console.error("getAllOrders error:", error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};
