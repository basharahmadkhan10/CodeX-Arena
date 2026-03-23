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

export const clearBattleState = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { currentBattleId: null });
    res.json({ success: true, message: "Battle state cleared" });
  } catch (err) { next(err); }
};
