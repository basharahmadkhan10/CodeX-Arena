import User from "../models/User.js";
import Problem from "../models/Problem.js";
import { PROBLEMS_SEED } from "../data/problems.seed.js";

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id || req.user._id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("username rating wins losses draws totalBattles rank")
      .sort({ rating: -1 })
      .limit(50);
    res.json({ success: true, users });
  } catch (err) { next(err); }
};

export const seedProblems = async (req, res, next) => {
  try {
    let created = 0;
    for (const p of PROBLEMS_SEED) {
      const exists = await Problem.findOne({ slug: p.slug });
      if (!exists) { await Problem.create(p); created++; }
    }
    res.json({ success: true, message: `Seeded ${created} new problems (${PROBLEMS_SEED.length} total)` });
  } catch (err) { next(err); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { username, avatar } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (username && username.trim() !== user.username) {
      const cleanUsername = username.trim();
      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        return res.status(400).json({ success: false, message: "Username must be 3-20 characters long" });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return res.status(400).json({ success: false, message: "Username can only contain letters, numbers, and underscores" });
      }
      const existing = await User.findOne({ username: cleanUsername, _id: { $ne: userId } });
      if (existing) {
        return res.status(409).json({ success: false, message: "Username is already taken" });
      }
      user.username = cleanUsername;
    }

    if (avatar !== undefined) {
      user.avatar = avatar ? avatar.trim() : null;
    }

    await user.save();
    res.json({ success: true, message: "Profile updated successfully", user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

export const clearBattleState = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { currentBattleId: null });
    res.json({ success: true, message: "Battle state cleared" });
  } catch (err) { next(err); }
};
