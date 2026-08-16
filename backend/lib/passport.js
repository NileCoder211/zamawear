import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import User from "../models/userModel.js";
import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,

      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      callbackURL: process.env.SERVER_URL + "/api/auth/google/callback",
    },

  async (accessToken, refreshToken, profile, cb) => {
  try {
    const email = profile.emails[0].value;
    const emailVerified = profile.emails[0].verified;

    if (!emailVerified) {
      return cb(null, false, { message: "Google email not verified" });
    }

    let user = await User.findOne({ email });

    if (user) {
      // Only auto-link if this is already a Google-based account,
      // or explicitly require a re-auth/confirmation step to link
      // a password account to Google.
      if (!user.googleId && user.authProvider === "local") {
        // Don't silently link. Reject or require explicit confirmation.
        return cb(null, false, {
          message: "An account with this email already exists. Please log in with your password first, then link Google from your profile settings.",
        });
      }

      if (!user.googleId) {
        user.googleId = profile.id;
        user.authProvider = "google";
        user.profilePicture = profile.photos[0]?.value;
        await user.save();
      }

      return cb(null, user);
    }

    user = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email,
      profilePicture: profile.photos[0]?.value,
      authProvider: "google",
    });

    return cb(null, user);
  } catch (err) {
    return cb(err, null);
  }
}

export default passport;
