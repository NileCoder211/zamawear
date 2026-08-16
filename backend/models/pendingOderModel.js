import mongoose from "mongoose";

const pendingOrderSchema = new mongoose.Schema(
  {
    checkoutRequestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phone: {
      type: String,
      required: true,
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
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
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

      landmark: String,

      houseNumber: String,
    },
    // Written by the callback once Safaricom confirms
    trnxId: {
      type: String,
      default: null,
    },
    // "amount_mismatch" is written by mpesaCallback's amount-
    // verification check (a safeguard against a forged/incorrect
    // callback) — must be declared here even though findOneAndUpdate
    // doesn't run validators by default, since relying on that
    // default behavior is fragile and would break the moment anyone
    // adds { runValidators: true } later as a defensive improvement.
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "amount_mismatch"],
      default: "pending",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true },
);

// Auto-delete 2 hours after creation — enough time for any polling to finish
pendingOrderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 });

const PendingOrder = mongoose.model("PendingOrder", pendingOrderSchema);

export default PendingOrder;