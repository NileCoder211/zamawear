import express from "express";
import rateLimit from "express-rate-limit";
import {
  stkPush,
  confirmMpesaOrder,
  mpesaCallback,
  whatsappStkPush,
} from "../controllers/mpesaController.js";

import { protectRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Limit how often a single user can trigger a new STK push — prevents
// checkout spam that burns your Safaricom API quota and can trigger
// their own rate limiting against you.
const stkPushLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { message: "Too many payment attempts, please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Safaricom doesn't sign callbacks, so this is the best available
// guard: restrict the endpoint to Safaricom's known callback IP
// ranges. Check Safaricom's current developer docs for the
// sandbox/production ranges and keep this list updated — IPs can
// change. Treat this as defense-in-depth, not a complete solution;
// pairing it with a server-side Transaction Status Query confirmation
// (as noted in mpesaController.js) is the stronger fix.
const SAFARICOM_IP_ALLOWLIST = (process.env.MPESA_CALLBACK_IP_ALLOWLIST || "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

const restrictToSafaricom = (req, res, next) => {
  if (SAFARICOM_IP_ALLOWLIST.length === 0) {
    // Allowlist not configured — log loudly so this doesn't go
    // unnoticed, but don't block, since misconfiguring this would
    // silently break all payment confirmations.
    console.warn(
      "⚠️ MPESA_CALLBACK_IP_ALLOWLIST is not set — /callback is unrestricted by IP.",
    );
    return next();
  }

  // req.ip requires `app.set("trust proxy", ...)` to be configured
  // correctly if you're behind a load balancer/reverse proxy, or
  // this will see the proxy's IP instead of Safaricom's.
  const requestIp = req.ip;

  if (!SAFARICOM_IP_ALLOWLIST.includes(requestIp)) {
    console.warn(`Rejected M-Pesa callback from unexpected IP: ${requestIp}`);
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

router.post("/stkpush", protectRoute, stkPushLimiter, stkPush);

router.post("/confirm", protectRoute, confirmMpesaOrder);

router.post("/callback", restrictToSafaricom, mpesaCallback);

router.post("/whatsapp-stkpush", whatsappStkPush);

export default router;