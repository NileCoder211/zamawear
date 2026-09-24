import {
  whatsappStkPush,
} from "./mpesaController.js";
import WhatsAppOrder from "../models/whatsappOrderModel.js";

import {
  sendWhatsAppText,
} from "../services/whatsappService.js";

const normalisePhone = (phone) => {
  if (!phone) return null;

  let value = String(phone)
    .replace(/\D/g, "");

  if (value.startsWith("0")) {
    value =
      "254" +
      value.substring(1);
  }

  return value;
};

export const verifyWhatsAppWebhook =
  (req, res) => {
    const mode =
      req.query["hub.mode"];

    const token =
      req.query["hub.verify_token"];

    const challenge =
      req.query["hub.challenge"];

    if (
      mode === "subscribe" &&
      token ===
        process.env
          .WHATSAPP_VERIFY_TOKEN
    ) {
      return res
        .status(200)
        .send(challenge);
    }

    return res.sendStatus(403);
  };

export const receiveWhatsAppWebhook =
  async (req, res) => {
     console.log("🔔 WhatsApp webhook hit:", JSON.stringify(req.body));
    /*
     * Respond immediately so Meta doesn't
     * keep retrying the webhook.
     */
    res.sendStatus(200);

    try {
      const message =
        req.body?.entry?.[0]
          ?.changes?.[0]
          ?.value
          ?.messages?.[0];

      if (!message) {
        return;
      }

      const customerPhone =
        normalisePhone(
          message.from
        );

      if (!customerPhone) {
        return;
      }

      /*
       * We currently handle text messages.
       */
      const incomingText =
        message.text?.body
          ?.trim();

      if (!incomingText) {
        return;
      }

      const text =
        incomingText.toLowerCase();

      /*
       * Find the customer's latest
       * unfinished WhatsApp order.
       */
      let order =
        await WhatsAppOrder.findOne({
          whatsappPhone:
            customerPhone,

          status: {
            $nin: [
              "paid",
              "cancelled",
              "expired",
            ],
          },
        }).sort({
          createdAt: -1,
        });

      /*
       * If the order was initially created
       * by the website, attach the actual
       * WhatsApp customer number now.
       */
      if (order) {
        order.whatsappPhone =
          customerPhone;

        /*
         * If WhatsApp gives us the customer's
         * profile name, we can save it.
         */
        if (
          req.body?.entry?.[0]
            ?.changes?.[0]
            ?.value
            ?.contacts?.[0]
            ?.profile?.name
        ) {
          order.whatsappName =
            req.body.entry[0]
              .changes[0]
              .value.contacts[0]
              .profile.name;
        }

        await order.save();
      }

      /*
       * No existing order.
       */
      if (!order) {
        await sendWhatsAppText(
          customerPhone,

          `Hi 👋

I couldn't find an active order for this WhatsApp number.

Please start your order from our official website.

If you already have an order number, please send it here.`
        );

        return;
      }

      /*
       * CUSTOMER CONFIRMS THE PRODUCT
       */
      if (
        order.status ===
          "pending_confirmation" &&
        text === "confirm"
      ) {
        order.status =
          "customer_confirmed";

        await order.save();

        await sendWhatsAppText(
          customerPhone,

          `Great! 👍

Your order #${order.orderNumber} has been confirmed.

Please send your delivery details in this format:

Name:
Phone:
County:
Area:
House/Building:
Landmark:

Example:

Name: John Doe
Phone: 0712345678
County: Nairobi
Area: Westlands
House/Building: ABC Apartments
Landmark: Near Sarit Mall`
        );

        return;
      }

      /*
       * CUSTOMER SENDS DELIVERY DETAILS
       */
      if (
        order.status ===
          "customer_confirmed"
      ) {
        const address =
          parseDeliveryDetails(
            incomingText
          );

        if (
          !address.fullName ||
          !address.phoneNumber ||
          !address.county ||
          !address.area
        ) {
          await sendWhatsAppText(
            customerPhone,

            `I need a few more delivery details.

Please send them like this:

Name: John Doe
Phone: 0712345678
County: Nairobi
Area: Westlands
House/Building: ABC Apartments
Landmark: Near Sarit Mall`
          );

          return;
        }

        order.shippingAddress =
          address;

        order.status =
          "delivery_details_received";

        await order.save();

        await sendWhatsAppText(
          customerPhone,

          `Your order is ready. ✅

Order: #${order.orderNumber}

${formatProducts(order)}

Subtotal:
KES ${order.subtotal.toLocaleString()}

Delivery:
KES ${order.deliveryFee.toLocaleString()}

Total:
KES ${order.totalAmount.toLocaleString()}

Delivery:
${address.area}, ${address.county}

⚠️ No payment has been made yet.

Reply *PAY* to receive the M-Pesa payment prompt.`
        );

        return;
      }

      /*
       * CUSTOMER WANTS TO PAY
       *
       * The actual STK call will be added
       * to the M-Pesa controller in the next
       * section.
       */
      if (
        order.status ===
          "delivery_details_received" &&
        text === "pay"
      ) {
        await sendWhatsAppText(
          customerPhone,

          `We're preparing your M-Pesa payment request.

Order: #${order.orderNumber}

Amount:
KES ${order.totalAmount.toLocaleString()}

Please wait for the M-Pesa prompt on your phone.`
        );

        /*
         * TODO:
         * Call the WhatsApp STK controller/service.
         */
        return;
      }

      /*
       * CUSTOMER SAYS CANCEL
       */
      if (
        text === "cancel" &&
        ![
          "paid",
          "cancelled",
        ].includes(order.status)
      ) {
        order.status =
          "cancelled";

        await order.save();

        await sendWhatsAppText(
          customerPhone,

          `Your order #${order.orderNumber} has been cancelled.

No payment was made.`
        );

        return;
      }

      /*
       * DEFAULT RESPONSE
       */
      await sendWhatsAppText(
        customerPhone,

        `Order #${order.orderNumber}

Current status:
${order.status}

You can reply:

CONFIRM - confirm the order
PAY - pay for the order
CANCEL - cancel the order`
      );
    } catch (error) {
      console.error(
        "receiveWhatsAppWebhook:",
        error
      );
    }
  };

/*
 * Parses:
 *
 * Name: John Doe
 * Phone: 0712345678
 * County: Nairobi
 * Area: Westlands
 * House/Building: ABC Apartments
 * Landmark: Near Sarit
 */
const parseDeliveryDetails = (
  text
) => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const values = {};

  for (const line of lines) {
    const separator =
      line.indexOf(":");

    if (separator === -1) {
      continue;
    }

    const key =
      line
        .substring(
          0,
          separator
        )
        .trim()
        .toLowerCase();

    const value =
      line
        .substring(
          separator + 1
        )
        .trim();

    values[key] = value;
  }

  return {
    fullName:
      values.name || null,

    phoneNumber:
      normalisePhone(
        values.phone
      ),

    county:
      values.county || null,

    area:
      values.area || null,

    houseNumber:
      values["house/building"] ||
      values.house ||
      null,

    landmark:
      values.landmark || null,
  };
};

const formatProducts = (
  order
) => {
  return order.products
    .map(
      (item) =>
        `🛍️ ${item.name}\n` +
        `Quantity: ${item.quantity}\n` +
        `Price: KES ${item.price.toLocaleString()}` +
        (
          item.color
            ? `\nColor: ${item.color}`
            : ""
        ) +
        (
          item.size
            ? `\nSize: ${item.size}`
            : ""
        )
    )
    .join("\n\n");
};