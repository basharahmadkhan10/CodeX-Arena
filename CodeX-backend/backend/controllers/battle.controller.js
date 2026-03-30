import { getBattleById } from "../service/battle.service.js";
import Battle from "../models/Battle.js";

export const getActiveBattle = async (req, res, next) => {
  try {
    const battle = await Battle.findOne({
      "participants.user": req.user._id,
      status: "active",
    })
      .populate("problem", "title description difficulty examples constraints tags")
      .populate("participants.user", "username rating rank");

    if (!battle) return res.json({ success: true, battle: null });

    res.json({ success: true, battle });
  } catch (err) {
    next(err);
  }
};

export const getBattle = async (req, res, next) => {
  try {
    const battle = await getBattleById(req.params.id);
    if (!battle) return res.status(404).json({ success: false, message: "Battle not found" });
    res.json({ success: true, battle });
  } catch (err) {
    next(err);
  }
};

export const getUserBattleHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const battles = await Battle.find({
      "participants.user": req.user._id,
      status: "completed",
    })
      .populate("problem", "title difficulty")
      .populate("participants.user", "username rating rank")
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Battle.countDocuments({
      "participants.user": req.user._id,
      status: "completed",
    });

    res.json({ success: true, battles, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};
