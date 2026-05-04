import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/constants.js";
import Battle from "../models/Battle.js";

const signToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

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

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.currentBattleId) {
      const staleBattle = await Battle.findById(user.currentBattleId);
      if (!staleBattle || staleBattle.status !== "active" || 
          (staleBattle.startedAt && Date.now() - new Date(staleBattle.startedAt) > 60 * 60 * 1000)) {
        user.currentBattleId = null;
        await user.save();
        
        if (staleBattle && staleBattle.status === "active") {
          staleBattle.status = "cancelled";
          staleBattle.endReason = "disconnect_timeout";
          await staleBattle.save();
        }
      }
    }

    const token = signToken(user._id);

    // Set cookie for web browsers
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: process.env.NODE_ENV === "production" ? ".onrender.com" : undefined
    });

    // Return token in response body for frontend to store
    res.json({ 
      success: true, 
      token: token, 
      user: user.toSafeObject() 
    });
  } catch (err) {
    next(err);
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
