import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { GOOGLE_CLIENT_ID, JWT_SECRET, JWT_EXPIRES_IN } from "../config/constants.js";
import Battle from "../models/Battle.js";

const signToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const createUniqueUsername = async (email, googleId) => {
  const baseName = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 16) || "player";
  let username = baseName;
  let suffix = 1;

  while (await User.findOne({ username })) {
    username = `${baseName}${suffix}`;
    suffix += 1;
  }

  if (!username) {
    username = `google_${String(googleId).slice(-6)}`;
  }

  return username.slice(0, 20);
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? "Email" : "Username";
      return res.status(409).json({ success: false, message: `${field} is already taken` });
    }

    const user = await User.create({ username, email: email.toLowerCase(), password });
    const token = signToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: process.env.NODE_ENV === "production" ? ".onrender.com" : undefined
    });

    // Return token in response body for mobile apps and localStorage
    res.status(201).json({
      success: true,
      token: token, // ← IMPORTANT: Send token in response
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// auth.controller.js - Make sure this is exactly correct
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    console.log("Login attempt:", { email, passwordProvided: !!password });
    
    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find user by email (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(401).json({ success: false, message: "This account uses Google sign-in. Continue with Google." });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password valid:", isPasswordValid);
    
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Generate token
    const token = signToken(user._id);
    console.log("Token generated successfully for:", user.username);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Return success response with token
    return res.json({ 
      success: true, 
      token: token,  // CRITICAL: Must send token in response
      user: user.toSafeObject() 
    });
    
  } catch (err) {
    console.error("Login error:", err);
    next(err);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!googleClient || !GOOGLE_CLIENT_ID) {
      return res.status(500).json({ success: false, message: "Google sign-in is not configured on the server" });
    }

    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
    const googleId = payload?.sub;
    const emailVerified = payload?.email_verified;
    const name = payload?.name || payload?.given_name || email?.split("@")[0] || "Player";
    const picture = payload?.picture || null;

    if (!email || !googleId || !emailVerified) {
      return res.status(401).json({ success: false, message: "Google account could not be verified" });
    }

    let user = await User.findOne({ email });

    if (user) {
      user.googleId = user.googleId || googleId;
      user.authProvider = user.authProvider === "local" && user.password ? user.authProvider : "google";
      user.avatar = user.avatar || picture;
      if (!user.username) {
        user.username = await createUniqueUsername(email, googleId);
      }
      await user.save();
    } else {
      const username = await createUniqueUsername(email, googleId);
      user = await User.create({
        username,
        email,
        password: null,
        authProvider: "google",
        googleId,
        avatar: picture,
      });
    }

    const token = signToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: process.env.NODE_ENV === "production" ? ".onrender.com" : undefined,
    });

    return res.status(200).json({
      success: true,
      token,
      user: user.toSafeObject(),
    });
  }} catch (err) {
  console.error("Google Auth Error:", err);

  return res.status(500).json({
    success: false,
    message: err.message || "Google authentication failed",
  });
}
};

export const getMe = async (req, res) => {
  res.json({ 
    success: true, 
    user: req.user.toSafeObject() 
  });
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.NODE_ENV === "production" ? ".onrender.com" : undefined
  });
  
  res.json({ 
    success: true, 
    message: "Logged out successfully" 
  });
};
