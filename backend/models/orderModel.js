import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: false,
    },

    image: {
      type: String,
      required: false,
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

channel: {
  type: String,
  enum: ["website", "whatsapp"],
  default: "website",
  index: true,
},

whatsappPhone: {
  type: String,
  trim: true,
  default: null,
},

whatsappName: {
  type: String,
  trim: true,
  default: null,
},

    // Was `default: true` — a boolean default on a String field,
    // cast to the literal string "true". Combined with `unique`,
    // that means only ONE order could EVER be created without an
    // explicit orderNumber before every subsequent one failed on a
    // duplicate-key error. generateOrderNumber() always supplies a
    // real value in practice, but the field should enforce that
    // rather than silently fall back to a bogus default.
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    products: [orderItemSchema],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // M-Pesa only now — narrowed from ["stripe", "mpesa"].
    paymentMethod: {
      type: String,
      enum: ["mpesa"],
      default: "mpesa",
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // Note: "pending" here is never actually set in practice — M-Pesa
    // orders are only ever created by mpesaCallback AFTER payment
    // succeeds, always starting at "processing". Left in the enum in
    // case that changes later; harmless to keep.
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
      },

      phoneNumber: {
        type: String,
        required: true,
      },

      county: {
        type: String,
        required: true,
      },

      area: {
        type: String,
        required: true,
      },

      landmark: {
        type: String,
        default: "",
      },

      houseNumber: {
        type: String,
        default: "",
      },
    },

    // Dead now that Stripe is removed — left in place rather than
    // dropped outright, since removing fields from a live collection
    // is a bigger call than a code edit. Safe to delete later once
    // you've confirmed nothing else references them.
    stripeSessionId: { type: String, sparse: true, unique: true },
    stripePaymentIntentId: String,

    mpesaCheckoutRequestId: String,
    mpesaReceiptNumber: String,

    transactionId: String,

    estimatedDeliveryDate: Date,

    cancelledAt: Date,
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model("Order", orderSchema);
export default Order;