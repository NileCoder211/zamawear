import express from "express";
import rateLimit from "express-rate-limit";
import {sendVerificationCode, 
        verifyVerificationCode, 
        changePassword, 
        sendForgotPasswordCode, verifyForgotPasswordCode,
} from "../controllers/authController.js"; // adjust path/filename to match yours

import { protectRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Applies to anything that sends an email — signup verification and
// forgot-password codes. Prevents someone spamming your Gmail send
// quota or using it to enumerate/harass real user inboxes.
const emailSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limit for guessing the 6-digit code itself — this is the
// actual brute-force surface (1,000,000 possibilities, 5-minute
// window). A handful of attempts is enough for a legitimate typo;
// anything more is guessing.
const codeVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { message: "Too many attempts, please request a new code" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/send-verification-code", emailSendLimiter, sendVerificationCode);
router.post("/verify-verification-code", codeVerifyLimiter, verifyVerificationCode);

router.post("/change-password", protectRoute, changePassword);

router.post("/send-forgot-password-code", emailSendLimiter, sendForgotPasswordCode);
router.post("/verify-forgot-password-code", codeVerifyLimiter, verifyForgotPasswordCode);

export default router;