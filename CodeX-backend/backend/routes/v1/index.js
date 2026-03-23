import express from "express";
import authRoutes from "./auth.routes.js";
import battleRoutes from "./battle.routes.js";
import userRoutes from "./user.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/battles", battleRoutes);
router.use("/users", userRoutes);

export default router;
