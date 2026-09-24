import mongoose from "mongoose";

const whatsappOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    whatsappPhone: {
      type: String,
      required: true,
      index: true,
    },

    whatsappName: {
      type: String,
      trim: true,
      default: null,
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        name: {
          type: String,
          required: true,
        },

        image: {
          type: String,
          default: "",
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        color: {
          type: String,
          default: null,
        },

        size: {
          type: String,
          default: null,
        },
      },
    ],

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    couponCode: {
      type: String,
      default: null,
    },

    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    shippingAddress: {
      fullName: {
        type: String,
        default: null,
      },

      phoneNumber: {
        type: String,
        default: null,
      },

      county: {
        type: String,
        default: null,
      },

      area: {
        type: String,
        default: null,
      },

      landmark: {
        type: String,
        default: null,
      },

      houseNumber: {
        type: String,
        default: null,
      },
    },

    status: {
      type: String,

      enum: [
        "pending_confirmation",
        "available",
        "customer_confirmed",
        "delivery_details_received",
        "payment_pending",
        "paid",
        "cancelled",
        "expired",
      ],

      default: "pending_confirmation",

      index: true,
    },

    paymentStatus: {
      type: String,

      enum: [
        "unpaid",
        "pending",
        "paid",
        "failed",
      ],

      default: "unpaid",
    },

    mpesaCheckoutRequestId: {
      type: String,
      default: null,
    },

    finalOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    expiresAt: {
      type: Date,

      default: () =>
        new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ),

      index: true,
    },
  },

  {
    timestamps: true,
  }
);

const WhatsAppOrder =
  mongoose.model(
    "WhatsAppOrder",
    whatsappOrderSchema
  );

export default WhatsAppOrder;