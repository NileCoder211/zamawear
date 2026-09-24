import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Coupon from "../models/couponModel.js";
import Category from "../models/categoryModel.js";

// Revenue/sales figures exclude cancelled orders throughout this
// file. paymentStatus stays "paid" on a cancelled order (no refund
// automation exists), so counting cancellations toward revenue would
// overstate it — cancelled orders are tracked separately below
// (totalCancelledOrders) instead.
const NOT_CANCELLED = { orderStatus: { $ne: "cancelled" } };

export const getAnalyticsData = async () => {
  const [
    totalUsers,
    totalProducts,
    totalOutOfStockProducts,
    salesData,
    totalCancelledOrders,
    totalActiveCoupons,
    totalRedeemedCoupons,
  ] = await Promise.all([
    User.countDocuments({ deletedAt: null }),
    Product.countDocuments(),
    Product.countDocuments({ stock: 0 }),
    Order.aggregate([
      { $match: NOT_CANCELLED },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
    Order.countDocuments({ orderStatus: "cancelled" }),
    Coupon.countDocuments({ status: "available" }),
    Coupon.countDocuments({ status: "used" }),
  ]);

  const { totalSales, totalRevenue } = salesData[0] || {
    totalSales: 0,
    totalRevenue: 0,
  };

  return {
    users: totalUsers,
    products: totalProducts,
    outOfStockProducts: totalOutOfStockProducts,
    totalSales,
    totalRevenue,
    cancelledOrders: totalCancelledOrders,
    activeCoupons: totalActiveCoupons,
    redeemedCoupons: totalRedeemedCoupons,
  };
};

export const getDailySalesData = async (startDate, endDate) => {
  const dailySalesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        ...NOT_CANCELLED,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        sales: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dateArray = getDatesInRange(startDate, endDate);

  return dateArray.map((date) => {
    const foundData = dailySalesData.find((item) => item._id === date);
    return {
      date,
      sales: foundData?.sales || 0,
      revenue: foundData?.revenue || 0,
    };
  });
};

// New user signups per day, same shape as getDailySalesData — useful
// alongside it on a dashboard chart (growth vs. revenue).
export const getDailyUserSignups = async (startDate, endDate) => {
  const dailySignups = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        signups: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dateArray = getDatesInRange(startDate, endDate);

  return dateArray.map((date) => {
    const foundData = dailySignups.find((item) => item._id === date);
    return {
      date,
      signups: foundData?.signups || 0,
    };
  });
};

// Best sellers by revenue, within an optional date range (defaults to
// all-time). Uses the name/image already denormalized onto each
// order line item — this reflects what was actually sold at the
// time (e.g. a since-renamed or deleted product still shows
// correctly), rather than needing a live lookup against the current
// Product document.
export const getTopSellingProducts = async (
  limit = 5,
  startDate = null,
  endDate = null,
) => {
  const match = { ...NOT_CANCELLED };
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }

  return Order.aggregate([
    { $match: match },
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products.product",
        name: { $first: "$products.name" },
        image: { $first: "$products.image" },
        unitsSold: { $sum: "$products.quantity" },
        revenue: {
          $sum: { $multiply: ["$products.price", "$products.quantity"] },
        },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
  ]);
};

// Revenue broken down by top-level category (Male/Female/Children/
// Body Lotions & Creams) — this one DOES need a live lookup, since
// category isn't denormalized onto order line items the way
// name/image are.
export const getRevenueByCategory = async (
  startDate = null,
  endDate = null,
) => {
  const match = { ...NOT_CANCELLED };
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }

  return Order.aggregate([
    { $match: match },
    { $unwind: "$products" },
    {
      $lookup: {
        from: Product.collection.name,
        localField: "products.product",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: Category.collection.name,
        localField: "productDoc.category",
        foreignField: "_id",
        as: "categoryDoc",
      },
    },
    { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ["$categoryDoc.name", "Unknown"] },
        revenue: {
          $sum: { $multiply: ["$products.price", "$products.quantity"] },
        },
        unitsSold: { $sum: "$products.quantity" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
};

function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// ─────────────────────────────────────────────────────────────
// Express handler — the piece that was missing entirely. Without
// this, none of the functions above were reachable over HTTP.
// GET /api/analytics?days=7  (or ?startDate=...&endDate=...)
// ─────────────────────────────────────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    let { startDate, endDate, days } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - (Number(days) || 7) * 24 * 60 * 60 * 1000);

    const [
      analyticsData,
      dailySalesData,
      dailySignups,
      topProducts,
      revenueByCategory,
    ] = await Promise.all([
      getAnalyticsData(),
      getDailySalesData(start, end),
      getDailyUserSignups(start, end),
      getTopSellingProducts(5, start, end),
      getRevenueByCategory(start, end),
    ]);

    res.json({
      analyticsData,
      dailySalesData,
      dailySignups,
      topProducts,
      revenueByCategory,
    });
  } catch (error) {
    console.error("Error in getAnalytics controller", error.message);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};
