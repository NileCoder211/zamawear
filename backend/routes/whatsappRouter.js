import express from "express";

import {
  createWhatsAppOrder,
  verifyWhatsAppOrder
} from "../controllers/whatsappOrderController.js";

import {
  verifyWhatsAppWebhook,
  receiveWhatsAppWebhook,
} from "../controllers/whatsappWebhookController.js";

const router = express.Router();

router.get(
  "/orders/:orderNumber/verify",
  verifyWhatsAppOrder
);

/*
 * Website → create WhatsApp order
 */
router.post(
  "/orders",
  createWhatsAppOrder
);

/*
 * Meta webhook verification
 */
router.get(
  "/webhook",
  verifyWhatsAppWebhook
);

/*
 * Incoming WhatsApp messages
 */
router.post(
  "/webhook",
  receiveWhatsAppWebhook
);

export default router;