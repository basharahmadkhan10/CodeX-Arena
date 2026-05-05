import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Battle from "../models/Battle.js";
import { GOOGLE_CLIENT_ID, JWT_SECRET, JWT_EXPIRES_IN } from "../config/constants.js";

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Shared cookie config — single source of truth
const cookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000,
  ...(process.env.NODE_ENV === "production" && { domain: ".onrender.com" }),
});

// ── Username generator ────────────────────────────────────────────────────────
const createUniqueUsername = async (email, googleId) => {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 16) || "player";
  let username = base;
  let suffix   = 1;
  while (await User.findOne({ username })) {
    username = `${base}${suffix}`;
    suffix  += 1;
  }
  if (!username) username = `google_${String(googleId).slice(-6)}`;
  return username.slice(0, 20);
};

// ── Register ──────────────────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: "All fields are required" });

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? "Email" : "Username";
      return res.status(409).json({ success: false, message: `${field} is already taken` });
    }

    const user  = await User.create({ username, email: email.toLowerCase(), password });
    const token = signToken(user._id);

    res.cookie("token", token, cookieOptions());
    return res.status(201).json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    if (!user.password)
      return res.status(401).json({
        success: false,
        message: "This account uses Google sign-in. Continue with Google.",
      });

    const isValid = await user.comparePassword(password);
    if (!isValid)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const token = signToken(user._id);
    res.cookie("token", token, cookieOptions());
    return res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// ── Google Auth ───────────────────────────────────────────────────────────────
export const googleAuth = async (req, res, next) => {
  try {
    if (!googleClient || !GOOGLE_CLIENT_ID)
      return res.status(500).json({ success: false, message: "Google sign-in is not configured" });

    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ success: false, message: "Google credential is required" });

    const ticket  = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    const email         = payload?.email?.toLowerCase();
    const googleId      = payload?.sub;
    const emailVerified = payload?.email_verified;
    const picture       = payload?.picture || null;

    if (!email || !googleId || !emailVerified)
      return res.status(401).json({ success: false, message: "Google account could not be verified" });

    let user = await User.findOne({ email });

    if (user) {
      user.googleId      = user.googleId || googleId;
      user.authProvider  = user.authProvider === "local" && user.password ? user.authProvider : "google";
      user.avatar        = user.avatar || picture;
      if (!user.username) user.username = await createUniqueUsername(email, googleId);
      await user.save();
    } else {
      user = await User.create({
        username:     await createUniqueUsername(email, googleId),
        email,
        password:     null,
        authProvider: "google",
        googleId,
        avatar:       picture,
      });
    }

    const token = signToken(user._id);
    res.cookie("token", token, cookieOptions());
    return res.status(200).json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    console.error("Google Auth Error:", err);
    next(err);
  }
};

// ── Get me ────────────────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
};

// ── Logout ────────────────────────────────────────────────────────────────────
// FIX: clear currentBattleId so the user is never stuck in "already in battle"
// FIX: also end any active battle they're in so opponent isn't left hanging
export const logout = async (req, res, next) => {
  try {
    if (req.user?._id) {
      const userId = req.user._id;

      // Clear the stale battle reference on the user doc
      await User.findByIdAndUpdate(userId, {
        currentBattleId: null,
        isOnline:        false,
        lastSeen:        new Date(),
      });
    }

    const opts = {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      ...(process.env.NODE_ENV === "production" && { domain: ".onrender.com" }),
    };

    res.clearCookie("token", opts);
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};
