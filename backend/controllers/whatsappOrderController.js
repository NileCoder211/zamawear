import crypto from "crypto";

import Product from "../models/productModel.js";
import WhatsAppOrder from "../models/whatsappOrderModel.js";

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

const generateOrderNumber = () => {
  const timePart = Date.now().toString(36).toUpperCase(); // ~8 chars, keeps orders sortable by creation time
  const randomPart = crypto.randomBytes(1).toString("hex").toUpperCase(); // 2 chars, avoids same-millisecond collisions

  return `W${timePart}${randomPart}`; // e.g. WMUD7T6XTA9 — 11 chars, fits under the 12-char AccountReference limit
};

export const createWhatsAppOrder =
  async (req, res) => {
    try {
      const {
        productId,
        quantity = 1,
        selectedColor,
        selectedSize,
      } = req.body;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product is required",
        });
      }

      const qty = Number(quantity);

      if (
        !Number.isInteger(qty) ||
        qty < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity",
        });
      }

      const product =
        await Product.findOne({
          _id: productId,
          isActive: true,
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message:
            "This product does not have enough stock.",
        });
      }

      // Validate selected color if one was supplied.
      if (selectedColor) {
        const colorExists =
          product.colors?.some(
            (color) =>
              color.name === selectedColor
          );

        if (!colorExists) {
          return res.status(400).json({
            success: false,
            message:
              "Selected color is not available.",
          });
        }
      }

      const subtotal =
        product.price * qty;

      // Keep your actual delivery calculation
      // here when you have one.
      const deliveryFee = 0;

      const totalAmount =
        subtotal + deliveryFee;

      const order =
        await WhatsAppOrder.create({
          orderNumber:
            generateOrderNumber(),

          // This is temporarily filled with the
          // website/business WhatsApp number if
          // the customer has not yet messaged us.
          whatsappPhone:
            process.env
              .WHATSAPP_BUSINESS_PHONE,

          products: [
            {
              product: product._id,

              name: product.name,

              image:
                product.images?.[0] || "",

              price: product.price,

              quantity: qty,

              color:
                selectedColor || null,

              size:
                selectedSize || null,
            },
          ],

          subtotal,

          deliveryFee,

          totalAmount,

          status:
            "pending_confirmation",

          paymentStatus:
            "unpaid",
        });

      return res.status(201).json({
        success: true,

        orderNumber:
          order.orderNumber,

        orderId:
          order._id,

        totalAmount:
          order.totalAmount,
      });
    } catch (error) {
      console.error(
        "createWhatsAppOrder:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create WhatsApp order",
      });
    }
  };

  export const verifyWhatsAppOrder =
  async (req, res) => {
    try {
      const {
        orderNumber,
      } = req.params;

      const order =
        await WhatsAppOrder.findOne({
          orderNumber,
        }).select(
          "orderNumber products subtotal deliveryFee totalAmount status paymentStatus createdAt"
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      return res.json({
        success: true,

        business: {
          name:
            process.env
              .BUSINESS_NAME ||
            "Your Business",
        },

        order: {
          orderNumber:
            order.orderNumber,

          products:
            order.products.map(
              (item) => ({
                name: item.name,

                image: item.image,

                price: item.price,

                quantity:
                  item.quantity,

                color:
                  item.color,

                size:
                  item.size,
              })
            ),

          subtotal:
            order.subtotal,

          deliveryFee:
            order.deliveryFee,

          totalAmount:
            order.totalAmount,

          status:
            order.status,

          paymentStatus:
            order.paymentStatus,

          createdAt:
            order.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "verifyWhatsAppOrder:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify order",
      });
    }
  };