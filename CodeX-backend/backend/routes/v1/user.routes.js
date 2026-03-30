import express from "express";
import { getProfile, getLeaderboard, seedProblems, clearBattleState } from "../../controllers/user.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import Problem from "../../models/Problem.js";

const router = express.Router();

router.get("/leaderboard", getLeaderboard);
router.get("/profile/:id", authMiddleware, getProfile);
router.post("/seed-problems", seedProblems);
router.post("/clear-battle", authMiddleware, clearBattleState);
router.delete("/reset-problems", async (req, res) => {
  await Problem.deleteMany({});
  res.json({
    success: true,
    message: "All problems deleted — restart server to reseed",
  });
});

export default router;
