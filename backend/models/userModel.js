import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        // Which color/size the customer picked on the product page.
        // null means "no variant selected" (e.g. products with no
        // color/size options, like creams) — used, not omitted, so
        // equality checks in the cart controller behave consistently
        // whether or not the product has variants.
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
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    profilePicture: {
      type: String,
      default: "",
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    // These fields are used by your verification/password-reset controllers.
    // Marked select: false so they never come back on normal queries, and
    // your controllers already explicitly .select("+field") them when needed.

    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeValidation: {
      type: Number,
      select: false,
    },
    forgotPasswordCode: {
      type: String,
      select: false,
    },
    forgotPasswordCodeValidation: {
      type: Number,
      select: false,
    },

    // Set when a user deletes their account. The account is
    // anonymized (see accountDeletion.js) rather than removed,
    // so order history stays intact. protectRoute checks this to
    // block a deleted account's still-valid access token from
    // working during its remaining 15-minute lifetime.
    deletedAt: {
      type: Date,
      default: null,
    },

    // Grace-period deletion: set by requestAccountDeletion, cleared
    // automatically if the user logs back in before
    // deletionScheduledAt, or actioned by the scheduled cleanup job
    // once that date passes.
    pendingDeletion: {
      type: Boolean,
      default: false,
    },
    deletionScheduledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to hash password before saving to database.
// IMPORTANT: only re-hash when the password field was actually changed.
// Without the isModified guard, EVERY save() on a user document (e.g.
// linking a Google account, updating the wishlist, adding a cart item)
// re-hashes the already-hashed password, corrupting it and silently
// breaking that user's local login the next time they try.
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
