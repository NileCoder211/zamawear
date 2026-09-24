import express from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  logout,
  signup,
  refreshToken,
  getProfile,
  googleCallback,
} from "../controllers/authController.js";
import { protectRoute } from "../middlewares/authMiddleware.js";
import passport from "../lib/passport.js";

const router = express.Router();

// Prevents brute-forcing login credentials and signup spam/bot
// account creation. Keyed by IP by default.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);

// Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: process.env.CLIENT_URL + "/login",
  }),
  googleCallback,
);

export default router;