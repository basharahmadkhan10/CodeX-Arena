import express from "express";
import { getActiveBattle, getBattle, getUserBattleHistory } from "../../controllers/battle.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/active", getActiveBattle);
router.get("/history", getUserBattleHistory);
router.get("/:id", getBattle);

export default router;
