import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protectRoute = async (req, res, next) => {
	const accessToken = req.cookies.accessToken;

	if (!accessToken) {
		return res.status(401).json({ message: "Unauthorized - No access token provided" });
	}

	// JWT verification errors (expired/invalid/malformed token) are
	// handled separately from unexpected server errors (e.g. DB down),
	// so the client gets an accurate status code either way.
	let decoded;
	try {
		decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return res.status(401).json({ message: "Unauthorized - Access token expired" });
		}
		console.log("Error verifying access token", error.message);
		return res.status(401).json({ message: "Unauthorized - Invalid access token" });
	}

	try {
		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return res.status(401).json({ message: "Unauthorized - User not found" });
		}

		if (user.deletedAt) {
			return res.status(401).json({ message: "Unauthorized - Account no longer exists" });
		}

		req.user = user;
		next();
	} catch (error) {
		// A real server-side failure (DB unreachable, etc.) — not the
		// client's fault, so this should be a 500, not a 401.
		console.log("Error in protectRoute middleware", error.message);
		return res.status(500).json({ message: "Server error" });
	}
};

export const adminRoute = (req, res, next) => {
	// Defensive check: this middleware assumes protectRoute already ran
	// and set req.user. If it's ever mounted without protectRoute in
	// front of it, fail loudly in dev rather than silently 403-ing.
	if (!req.user) {
		console.log("adminRoute called without protectRoute running first — check route definition");
		return res.status(401).json({ message: "Unauthorized" });
	}

	if (req.user.role === "admin") {
		return next();
	}

	return res.status(403).json({ message: "Access denied - Admin only" });
};