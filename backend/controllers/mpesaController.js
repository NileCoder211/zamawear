import Coupon from "../models/couponModel.js";
import Order from "../models/orderModel.js";
import PendingOrder from "../models/pendingorderModel.js";
import Product from "../models/productModel.js";
import { generateOrderNumber } from "../lib/generateOrderNumber.js";
import { getValidCoupon, markCouponUsed, issueRewardCoupon } from "../lib/coupons.js";
import WhatsAppOrder from "../models/whatsappOrderModel.js";
import {sendWhatsAppText,} from "../services/whatsappService.js";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const getMpesaPassword = (timestamp) => {
  const shortcode = process.env.SHORT_CODE;
  const passkey = process.env.PASSKEY;
  return Buffer.from(shortcode + passkey + timestamp).toString("base64");
};

const generateToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString("base64");

  const response = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } },
  );

  const data = await response.json();
  return data.access_token;
};

const getTimestamp = () => {
  const d = new Date();
  return (
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0") +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0")
  );
};

const normalisePhone = (phone) => {
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("0")) return `254${cleaned.substring(1)}`;
  if (cleaned.startsWith("+")) return cleaned.substring(1);
  return cleaned;
};

const calculateOrderTotals = async (products) => {
  let total = 0;
  const validatedProducts = [];

  for (const item of products) {
    const product = await Product.findById(item._id || item.id);

    if (!product) throw new Error("Product not found");

    if (product.stock < item.quantity) {
      throw new Error(`${product.name} is out of stock`);
    }

    total += product.price * item.quantity;

    validatedProducts.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
    });
  }

  return { total, validatedProducts };
};

// Atomic, conditional stock decrement. Each update only succeeds if
// enough stock is still available at the moment it runs, closing the
// check-then-act race between calculateOrderTotals's check and this
// decrement (which can happen minutes later, after the user pays).
//
// Because payment has already been captured by the time this runs, a
// failed decrement can't just cancel the order — instead we flag it
// for manual review so nothing gets silently oversold or silently lost.
const reduceStock = async (products) => {
  const shortages = [];

  for (const item of products) {
    const productId = item.product || item.id;
    const result = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true },
    );

    if (!result) {
      shortages.push({ productId, quantityRequested: item.quantity });
    }
  }

  if (shortages.length > 0) {
    console.error(
      "⚠️ Stock shortage after payment — needs manual reconciliation:",
      JSON.stringify(shortages),
    );
  }

  return shortages;
};

// ─────────────────────────────────────────────────────────────
// STK PUSH
// Mount this route behind protectRoute AND a rate limiter, e.g.:
//   router.post("/mpesa/stk-push", protectRoute, stkPushLimiter, stkPush);
// ─────────────────────────────────────────────────────────────

export const stkPush = async (req, res) => {
  try {
    const { phone, products, couponCode, shippingAddress } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number required" });
    }

    const { total, validatedProducts } = await calculateOrderTotals(products);

    let finalTotal = total;
    let appliedCoupon = null;
    const normalizedCouponCode = couponCode ? couponCode.trim().toUpperCase() : null;

    if (normalizedCouponCode) {
      // Centralized in lib/coupons.js so validation logic (status,
      // expiry, minimum order amount, maxDiscount cap) can't drift
      // between this checkout path and the standalone /validate
      // endpoint — the previous inline version here checked status
      // against "AVAILABLE" (wrong case vs the schema's lowercase
      // enum), used a stale `userId` field name, ignored
      // minimumOrderAmount entirely, and never applied maxDiscount.
      const result = await getValidCoupon(normalizedCouponCode, req.user._id, finalTotal);
      if (!result.error) {
        appliedCoupon = result.coupon;
        finalTotal -= result.discount;
      }
      // If invalid (wrong code, expired, below minimum, etc.), we
      // silently proceed without a discount rather than blocking
      // checkout — the frontend should already have called
      // /coupons/validate before reaching this point and surfaced
      // any error there.
    }

    finalTotal = Math.round(finalTotal);

    const token = await generateToken();
    const timestamp = getTimestamp();
    const shortcode = process.env.SHORT_CODE;
    const passkey = process.env.PASSKEY;
    const password = Buffer.from(shortcode + passkey + timestamp).toString(
      "base64",
    );
    const phoneNumber = normalisePhone(phone);
    // in stkPush, just before the fetch to Safaricom's stkpush endpoint
console.log("📞 Using CallBackURL:", process.env.CALLBACK_URL);

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: finalTotal,
          PartyA: phoneNumber,
          PartyB: shortcode,
          PhoneNumber: phoneNumber,
          CallBackURL: process.env.CALLBACK_URL,
          AccountReference: "Furniture Order",
          TransactionDesc: "Furniture Payment",
        }),
      },
    );

    const data = await response.json();

    if (!data.CheckoutRequestID) {
      return res.status(400).json({ message: "STK push failed", error: data });
    }

    await PendingOrder.create({
      checkoutRequestId: data.CheckoutRequestID,
      userId: req.user._id,
      products: validatedProducts,
      totalAmount: finalTotal,
      couponCode,
      couponId: appliedCoupon?._id || null,
      shippingAddress,
      phone: phoneNumber,
      status: "pending",
    });

    res.status(200).json({
      success: true,
      CheckoutRequestID: data.CheckoutRequestID,
      totalAmount: finalTotal,
    });
  } catch (error) {
    console.error("stkPush error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// MPESA CALLBACK
//
// SECURITY: this endpoint receives no authentication from Safaricom
// beyond the URL being secret. At minimum, apply an IP allowlist
// middleware in your routes file restricting this to Safaricom's
// documented callback IP ranges. Stronger: after receiving a
// "success" callback, call Safaricom's Transaction Status Query API
// to independently confirm the payment before creating the order,
// rather than trusting the callback body alone.
// ─────────────────────────────────────────────────────────────

export const mpesaCallback = async (req, res) => {
  try {
    console.log("🔔 Safaricom callback:", JSON.stringify(req.body));

    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      return res.status(400).json({ message: "Invalid callback" });
    }

    const checkoutRequestId = callback.CheckoutRequestID;

    // Payment failed / cancelled
    if (!callback.CallbackMetadata) {
      console.log("Payment failed:", callback.ResultDesc);

      await PendingOrder.findOneAndUpdate(
        { checkoutRequestId },
        { status: "failed" },
      );

      return res.status(200).json({ message: "ok" });
    }

    const items = callback.CallbackMetadata.Item;
    const getValue = (name) => items.find((i) => i.Name === name)?.Value;

    const receipt = getValue("MpesaReceiptNumber");
    const amount = getValue("Amount");
    const phone = getValue("PhoneNumber");

    const pending = await PendingOrder.findOne({ checkoutRequestId });

    if (!pending) {
      console.warn("No PendingOrder for:", checkoutRequestId);
      return res.status(200).json({ message: "ok" });
    }

    // Verify the amount Safaricom actually processed matches what we
    // expected to charge. A mismatch is suspicious and shouldn't be
    // silently accepted.
    if (Number(amount) !== Number(pending.totalAmount)) {
      console.error(
        `⚠️ Amount mismatch for ${checkoutRequestId}: expected ${pending.totalAmount}, got ${amount}. Flagging for review, not auto-completing.`,
      );
      await PendingOrder.findOneAndUpdate(
        { checkoutRequestId },
        { status: "amount_mismatch", trnxId: receipt },
      );
      return res.status(200).json({ message: "ok" });
    }

    // Duplicate protection
    const existingOrder = await Order.findOne({ transactionId: receipt });
    if (existingOrder) {
      await PendingOrder.findOneAndUpdate(
        { checkoutRequestId },
        { status: "completed", orderId: existingOrder._id, trnxId: receipt },
      );
      return res.status(200).json({ message: "ok" });
    }
    if (pending.status === "completed") {
      return res.json({
        ResultCode: 0,
        ResultDesc: "Already processed",
      });
    }

    const orderNumber = await generateOrderNumber("mpesa");

    // PendingOrder.products only ever stores {product, quantity,
    // price} — it never had name/image fields, so reading p.name /
    // p.images off it was always undefined. Look the products up
    // properly instead of relying on the one-off backfill script to
    // patch this after the fact on every future order.
    const productIds = pending.products.map((p) => p.product);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    const order = await Order.create({
      user: pending.userId,
      products: pending.products.map((p) => {
        const dbProduct = dbProducts.find(
          (dp) => dp._id.toString() === p.product.toString(),
        );
        return {
          product: p.product,
          quantity: p.quantity,
          price: p.price,
          name: dbProduct?.name || "Product",
          image: dbProduct?.images?.[0]?.url || "",
        };
      }),
      totalAmount: pending.totalAmount,
      paymentMethod: "mpesa",
      paymentStatus: "paid",
      orderStatus: "processing",
      transactionId: receipt,
      mpesaCheckoutRequestId: checkoutRequestId,
      mpesaReceiptNumber: receipt,
      orderNumber,
      shippingAddress: pending.shippingAddress,
      phoneNumber: pending.phone,
      estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await reduceStock(pending.products);

    // Coupon bookkeeping is isolated in its own try/catch — a
    // failure here must NEVER prevent the PendingOrder completion
    // update below from running. The previous version of this block
    // used status: "AVAILABLE" (uppercase) against a lowercase
    // schema enum, which threw a validation error on every
    // reward-eligible order and skipped the completion update
    // entirely — meaning the customer's order had actually
    // succeeded (payment captured, stock deducted) but their
    // frontend would poll confirmMpesaOrder forever and never see
    // it confirmed.
    try {
      if (pending.couponId) {
        const usedCoupon = await Coupon.findById(pending.couponId);
        if (usedCoupon && usedCoupon.status === "available") {
          await markCouponUsed(usedCoupon, order._id);
        }
      }

      await issueRewardCoupon(pending.userId, pending.totalAmount);
    } catch (couponError) {
      console.error(
        `Coupon bookkeeping failed for order ${order._id} — order itself succeeded:`,
        couponError.message,
      );
    }

    await PendingOrder.findOneAndUpdate(
      { checkoutRequestId },
      { status: "completed", orderId: order._id, trnxId: receipt },
    );

    console.log("✅ M-Pesa order created:", order._id);
    res.status(200).json({ message: "ok" });
  } catch (error) {
    console.error("mpesaCallback error:", error);
    res.status(200).json({ message: "ok" }); // always 200 so Safaricom doesn't retry
  }
};

// ─────────────────────────────────────────────────────────────
// CONFIRM MPESA ORDER
// Called by MpesaPendingPage polling every 4 seconds.
// Mount behind protectRoute.
// ─────────────────────────────────────────────────────────────

export const confirmMpesaOrder = async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;

    if (!checkoutRequestId) {
      return res.status(400).json({ error: "checkoutRequestId is required" });
    }

    const pending = await PendingOrder.findOne({ checkoutRequestId });

    if (!pending) {
      return res.status(404).json({
        error:
          "Session expired or not found. Contact support if money was deducted.",
      });
    }

    // Ownership check: don't let one user poll another user's
    // checkout status or order ID just by knowing/guessing their
    // checkoutRequestId.
    if (pending.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (pending.status === "failed") {
      return res.status(400).json({
        error: "Payment was cancelled or failed. Please try again.",
      });
    }

    if (pending.status === "amount_mismatch") {
      return res.status(400).json({
        error:
          "There was a problem confirming your payment. Please contact support.",
      });
    }

    if (pending.status === "completed" && pending.orderId) {
      return res.status(200).json({
        success: true,
        orderId: pending.orderId,
        message: "Payment confirmed",
      });
    }

    return res.status(202).json({
      pending: true,
      message: "Waiting for Safaricom to confirm...",
    });
  } catch (error) {
    console.error("confirmMpesaOrder error:", error);
    res
      .status(500)
      .json({ message: "Confirmation failed", error: error.message });
  }
};



export const whatsappStkPush =
  async (req, res) => {
    try {
      const {
        orderNumber,
        phone,
      } = req.body;

      if (!orderNumber) {
        return res.status(400).json({
          success: false,
          message:
            "WhatsApp order number is required",
        });
      }

      const whatsappOrder =
        await WhatsAppOrder.findOne({
          orderNumber,
        });

      if (!whatsappOrder) {
        return res.status(404).json({
          success: false,
          message:
            "WhatsApp order not found",
        });
      }

      if (
        [
          "paid",
          "cancelled",
          "expired",
        ].includes(
          whatsappOrder.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This order cannot be paid",
        });
      }

      if (
        whatsappOrder.paymentStatus ===
        "pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment is already pending",
        });
      }

      /*
       * Use the phone supplied by the customer
       * or the delivery phone.
       */
      const paymentPhone =
        phone ||
        whatsappOrder
          .shippingAddress
          ?.phoneNumber;

      if (!paymentPhone) {
        return res.status(400).json({
          success: false,
          message:
            "M-Pesa phone number is required",
        });
      }

      /*
       * IMPORTANT:
       *
       * We DO NOT trust the amount from the
       * frontend/WhatsApp message.
       *
       * We use the amount stored on the
       * server-side WhatsAppOrder.
       */
      const amount =
        whatsappOrder.totalAmount;

      /*
       * Get Safaricom OAuth token.
       *
       * Use the same generateToken() function
       * you already have in mpesaController.js.
       */
      const token =
        await generateToken();

      /*
       * Use the same timestamp/password logic
       * from your existing stkPush function.
       *
       * The exact code below should mirror your
       * existing stkPush implementation.
       */

      const timestamp = getTimestamp();
const password = getMpesaPassword(timestamp);
const stkUrl = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

      const normalisedPhone =
        normalisePhone(
          paymentPhone
        );

      const response =
        await fetch(stkUrl, {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            BusinessShortCode:
              process.env
                .MPESA_SHORTCODE,

            Password: password,

            Timestamp: timestamp,

            TransactionType:
              "CustomerPayBillOnline",

            Amount: amount,

            PartyA:
              normalisedPhone,

            PartyB:
              process.env
                .MPESA_SHORTCODE,

            PhoneNumber:
              normalisedPhone,

            CallBackURL:
              process.env
                .MPESA_CALLBACK_URL,

            AccountReference:
              whatsappOrder.orderNumber,

            TransactionDesc:
              `Payment for ${whatsappOrder.orderNumber}`,
          }),
        });

      const data =
        await response.json();

      if (
        !response.ok ||
        data.ResponseCode !== "0"
      ) {
        console.error(
          "WhatsApp STK error:",
          data
        );

        return res.status(400).json({
          success: false,
          message:
            data.ResponseDescription ||
            "Unable to initiate M-Pesa payment",
        });
      }

      /*
       * Create PendingOrder.
       */
      const pending =
        await PendingOrder.create({
          checkoutRequestId:
            data.CheckoutRequestID,

          userId: null,

          channel: "whatsapp",

          whatsappOrderId:
            whatsappOrder._id,

          phone:
            normalisedPhone,

          couponCode:
            whatsappOrder.couponCode,

          couponId:
            whatsappOrder.couponId,

          products:
            whatsappOrder.products.map(
              (item) => ({
                product:
                  item.product,

                quantity:
                  item.quantity,

                price:
                  item.price,
              })
            ),

          totalAmount:
            whatsappOrder.totalAmount,

          shippingAddress:
            whatsappOrder.shippingAddress,

          status: "pending",
        });

      whatsappOrder.paymentStatus =
        "pending";

      whatsappOrder.status =
        "payment_pending";

      whatsappOrder.mpesaCheckoutRequestId =
        data.CheckoutRequestID;

      await whatsappOrder.save();

      return res.status(200).json({
        success: true,

        checkoutRequestId:
          data.CheckoutRequestID,

        totalAmount:
          amount,

        pendingOrderId:
          pending._id,
      });
    } catch (error) {
      console.error(
        "whatsappStkPush:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to initiate WhatsApp M-Pesa payment",
      });
    }
  };