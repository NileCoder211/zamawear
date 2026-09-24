import crypto from "crypto";
import { redis } from "../lib/redis.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import transport from "../lib/nodeMailer.js"; 
import { hmacProcess } from "../lib/hashing.js"; 
import {acceptCodeSchema, changePasswordSchema, acceptForgotPasswordCodeSchema} from "../middlewares/authValidator.js"; 
import {GRACE_PERIOD_DAYS, anonymizeUser, checkAndCancelPendingDeletion} from "../lib/accountDeletion.js"; 

// ─────────────────────────────────────────────────────────────
// TOKEN / COOKIE HELPERS
// ─────────────────────────────────────────────────────────────

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60,
  );
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// ─────────────────────────────────────────────────────────────
// SIGNUP / LOGIN / LOGOUT / REFRESH / PROFILE / GOOGLE
// ─────────────────────────────────────────────────────────────

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: "Account created successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error in signup controller:", error); 
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.comparePassword(password))) {
      const deletionStatus = await checkAndCancelPendingDeletion(user);

      if (deletionStatus === "expired") {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      res.json({
        message: "Logged in successfully",
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(deletionStatus === "cancelled" && {
          message: "Your scheduled account deletion has been cancelled.",
        }),
      });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        await redis.del(`refresh_token:${decoded.userId}`);
      } catch (error) {
        console.log("Logout: refresh token invalid or expired, skipping redis cleanup");
      }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(200).json({success: true, message: "Logged out successfully"});
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== oldRefreshToken) {
      await redis.del(`refresh_token:${decoded.userId}`);
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: "Invalid refresh token — session revoked" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
    await storeRefreshToken(decoded.userId, newRefreshToken);
    setCookies(res, accessToken, newRefreshToken);

    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.log("Error in refreshToken controller", error.message);
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.redirect(process.env.CLIENT_URL);
  } catch (error) {
    console.log("Google auth controller error", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};

// ─────────────────────────────────────────────────────────────
// EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────────

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });

    // Generic response either way — don't reveal whether this email
    // has an account (user enumeration).
    if (!existingUser || existingUser.verified) {
      return res.status(200).json({
        success: true,
        message: "If that account exists and isn't verified, a code has been sent.",
      });
    }

    const codeValue = crypto.randomInt(100000, 1000000).toString();

    const info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Verification code",
      html: `<h1>${codeValue}</h1>`,
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();
      await existingUser.save();
    }

    return res.status(200).json({
      success: true,
      message: "If that account exists and isn't verified, a code has been sent.",
    });
  } catch (error) {
    console.log("Error in sendVerificationCode", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyVerificationCode = async (req, res) => {
  const { email, providedCode } = req.body;
  try {
    const { error } = acceptCodeSchema.validate({ email, providedCode });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation",
    );

    if (!existingUser) {
      return res.status(401).json({ success: false, message: "Invalid code" });
    }
    if (existingUser.verified) {
      return res.status(400).json({ success: false, message: "You are already verified!" });
    }
    if (!existingUser.verificationCode || !existingUser.verificationCodeValidation) {
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "Code has expired" });
    }

    const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

    const providedBuf = Buffer.from(hashedCodeValue);
    const storedBuf = Buffer.from(existingUser.verificationCode);
    const isMatch =
      providedBuf.length === storedBuf.length &&
      crypto.timingSafeEqual(providedBuf, storedBuf);

    if (isMatch) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();
      return res.status(200).json({ success: true, message: "Your account has been verified" });
    }

    return res.status(400).json({ success: false, message: "Invalid code" });
  } catch (error) {
    console.log("Error in verifyVerificationCode", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// CHANGE PASSWORD (logged-in user)
// ─────────────────────────────────────────────────────────────

export const changePassword = async (req, res) => {
  // req.user is the full document set by protectRoute — use ._id,
  // not .userId (that field doesn't exist on it).
  const userId = req.user._id;
  const { oldPassword, newPassword } = req.body;

  try {
    const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ _id: userId }).select("+password +verified");
    if (!existingUser) {
      return res.status(401).json({ success: false, message: "User does not exist!" });
    }

    if (!existingUser.verified) {
      return res.status(403).json({ success: false, message: "You are not a verified user!" });
    }

    const result = await existingUser.comparePassword(oldPassword);
    if (!result) {
      return res.status(401).json({ success: false, message: "Invalid credentials!" });
    }

    // Assign the plaintext new password and let the model's pre-save
    // hook hash it. Hashing it here too (as the original code did)
    // double-hashes the password — the hook re-hashes whatever's in
    // this field on save, so bcrypt(bcrypt(newPassword)) gets stored,
    // and the user is locked out on their next login attempt.
    existingUser.password = newPassword;
    await existingUser.save();

    // Kill the existing session — a stolen refresh token stops working
    // the moment the password changes.
    await redis.del(`refresh_token:${userId}`);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({ success: true, message: "Password updated!" });
  } catch (error) {
    console.log("Error in changePassword", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────

export const sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const codeValue = crypto.randomInt(100000, 1000000).toString();

      const info = await transport.sendMail({
        from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        to: existingUser.email,
        subject: "Forgot password code",
        html: `<h1>${codeValue}</h1>`,
      });

      if (info.accepted[0] === existingUser.email) {
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        existingUser.forgotPasswordCode = hashedCodeValue;
        existingUser.forgotPasswordCodeValidation = Date.now();
        await existingUser.save();
      }
    }

    // Same response whether or not the account exists.
    return res.status(200).json({
      success: true,
      message: "If that account exists, a code has been sent.",
    });
  } catch (error) {
    console.log("Error in sendForgotPasswordCode", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    const { error } = acceptForgotPasswordCodeSchema.validate({
      email,
      providedCode,
      newPassword,
    });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation",
    );

    if (!existingUser) {
      return res.status(401).json({ success: false, message: "Invalid code" });
    }

    if (!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation) {
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    if (Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "Code has expired" });
    }

    const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

    const providedBuf = Buffer.from(hashedCodeValue);
    const storedBuf = Buffer.from(existingUser.forgotPasswordCode);
    const isMatch =
      providedBuf.length === storedBuf.length &&
      crypto.timingSafeEqual(providedBuf, storedBuf);

    if (isMatch) {
      // Same fix as changePassword — assign plaintext, let the
      // pre-save hook hash it once.
      existingUser.password = newPassword;
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();

      // Same as changePassword — a forgotten-password reset should
      // also kill any existing session tied to the old credentials.
      await redis.del(`refresh_token:${existingUser._id}`);

      return res.status(200).json({ success: true, message: "Password updated!" });
    }

    return res.status(400).json({ success: false, message: "Invalid code" });
  } catch (error) {
    console.log("Error in verifyForgotPasswordCode", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE ACCOUNT (grace-period soft delete)
//
// Requesting deletion does NOT immediately wipe the account — it
// flags it as pending and logs the user out. If they log back in
// within GRACE_PERIOD_DAYS, checkAndCancelPendingDeletion (called
// from login) automatically cancels it. If the grace period passes
// without a login, the scheduled job (accountDeletionJob.js) runs
// anonymizeUser and the deletion becomes permanent.
//
// Requires re-authentication: current password for local accounts,
// or a typed confirmation phrase for Google-only accounts that have
// no password to check.
// ─────────────────────────────────────────────────────────────

export const deleteAccount = async (req, res) => {
  const userId = req.user._id;
  const { password, confirmation } = req.body;

  try {
    const existingUser = await User.findById(userId).select("+password");
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (existingUser.authProvider === "google" && !existingUser.password) {
      if (confirmation !== "DELETE") {
        return res.status(400).json({
          success: false,
          message: 'Type "DELETE" in the confirmation field to proceed.',
        });
      }
    } else {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to delete your account.",
        });
      }
      const result = await existingUser.comparePassword(password);
      if (!result) {
        return res.status(401).json({ success: false, message: "Invalid credentials!" });
      }
    }

    const scheduledFor = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    existingUser.pendingDeletion = true;
    existingUser.deletionScheduledAt = scheduledFor;
    await existingUser.save();

    // Kill the current session immediately — they'll need to log
    // back in during the grace period to cancel.
    await redis.del(`refresh_token:${userId}`);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // Let them know what happened and how to undo it, in case this
    // wasn't them (compromised account) or they change their mind.
    try {
      await transport.sendMail({
        from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        to: existingUser.email,
        subject: "Your account is scheduled for deletion",
        html: `<p>Your account will be permanently deleted on ${scheduledFor.toDateString()}.</p>
               <p>Log back in before then to cancel the deletion. If you didn't request this, log in now and change your password.</p>`,
      });
    } catch (emailError) {
      // Don't fail the request over a notification email — the
      // deletion is already scheduled regardless.
      console.error("Failed to send deletion notice email:", emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: `Account scheduled for deletion on ${scheduledFor.toDateString()}. Log back in before then to cancel.`,
      deletionScheduledAt: scheduledFor,
    });
  } catch (error) {
    console.log("Error in deleteAccount", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};