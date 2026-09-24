import express from "express";
import { adminRoute, protectRoute } from "../middlewares/authMiddleware.js";
import {
	getAnalyticsData,
	getDailySalesData,
	getDailyUserSignups,
	getTopSellingProducts,
	getRevenueByCategory,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, async (req, res) => {
	try {
		// Was hardcoded to a fixed 7-day window — now accepts
		// ?days=30 or an explicit ?startDate=&endDate=, defaulting to
		// the same 7 days as before if nothing is passed.
		const { startDate: startDateParam, endDate: endDateParam, days } = req.query;

		const endDate = endDateParam ? new Date(endDateParam) : new Date();
		const startDate = startDateParam
			? new Date(startDateParam)
			: new Date(endDate.getTime() - (Number(days) || 7) * 24 * 60 * 60 * 1000);

		const [analyticsData, dailySalesData, dailySignups, topProducts, revenueByCategory] =
			await Promise.all([
				getAnalyticsData(),
				getDailySalesData(startDate, endDate),
				getDailyUserSignups(startDate, endDate),
				getTopSellingProducts(5, startDate, endDate),
				getRevenueByCategory(startDate, endDate),
			]);

		res.json({
			analyticsData,
			dailySalesData,
			dailySignups,
			topProducts,
			revenueByCategory,
		});
	} catch (error) {
		console.error("Error in analytics route", error.message);
		res.status(500).json({ message: "Server error" });
	}
});

export default router;