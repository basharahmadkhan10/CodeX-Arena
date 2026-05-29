import { submitSolution, endBattle } from "../service/battle.service.js";
import { executeCode } from "../service/codeExecution.service.js";
import { clearBattleTimer } from "../service/matchmaking.service.js";
import Battle from "../models/Battle.js";
import User from "../models/User.js";

const disconnectTimers = new Map();
const submitCooldowns  = new Map();
const runCooldowns     = new Map();

const SUBMIT_COOLDOWN_MS = 10_000;
const RUN_COOLDOWN_MS    = 3_000;

function canDo(map, userId, cooldownMs) {
  const last = map.get(userId) || 0;
  if (Date.now() - last < cooldownMs) return false;
  map.set(userId, Date.now());
  return true;
}

const battleHandler = (io, socket) => {
  const userId = socket.user._id.toString();
  // Client emits this after a socket reconnect to re-enter their battle room.
  socket.on("battle:rejoin", async ({ roomId, battleId }) => {
    try {
      if (!roomId || !battleId) return;

      const battle = await Battle.findById(battleId).select("status participants roomId");
      if (!battle || battle.status !== "active") {
        socket.emit("battle:error", { message: "Battle is no longer active." });
        return;
      }

      const isParticipant = battle.participants.some(
        (p) => p.user.toString() === userId
      );
      if (!isParticipant) {
        socket.emit("battle:error", { message: "Not a participant in this battle." });
        return;
      }

      socket.join(roomId);
      console.log(`🔄 [${roomId}] ${socket.user.username} rejoined after reconnect`);

      // Cancel the pending disconnect-forfeit timer for this user
      if (disconnectTimers.has(userId)) {
        clearTimeout(disconnectTimers.get(userId));
        disconnectTimers.delete(userId);
        console.log(`[disconnect grace] Cancelled for ${socket.user.username} — reconnected`);
      }

      // Tell opponent they're back
      socket.to(roomId).emit("battle:opponent_reconnected", {
        userId,
        username: socket.user.username,
      });

      socket.emit("battle:rejoined", { roomId, battleId });
    } catch (err) {
      console.error("[battle:rejoin]", err.message);
      socket.emit("battle:error", { message: "Failed to rejoin battle." });
    }
  });
  socket.on("battle:submit", async ({ battleId, code, language }) => {
    if (!canDo(submitCooldowns, userId, SUBMIT_COOLDOWN_MS)) {
      socket.emit("battle:error", { message: "Please wait before submitting again." });
      return;
    }

    socket.emit("battle:submission_pending");

    // Notify opponent
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("battle:opponent_submitting", {
          username: socket.user.username,
        });
      }
    }

    try {
      const result = await submitSolution(battleId, userId, code, language, io);
      socket.emit("battle:submission_result", result);

      if (result.status === "AC") {
        const battle = await Battle.findById(battleId).select("status roomId");
        if (battle?.status === "completed") clearBattleTimer(battle.roomId);
      }
    } catch (err) {
      socket.emit("battle:error", { message: err.message });
    }
  });
  socket.on("battle:run_code", async ({ code, language, input }) => {
    if (!canDo(runCooldowns, userId, RUN_COOLDOWN_MS)) {
      socket.emit("battle:run_result", {
        output: "Please wait a moment before running again.",
        error: true,
      });
      return;
    }

    try {
      const result = await executeCode(code, language, input || "");
      socket.emit("battle:run_result", {
        output: result.output || result.stderr || "(no output)",
        cpuTime: null,
        error: result.exitCode !== 0,
      });
    } catch (err) {
      socket.emit("battle:run_result", { output: `Error: ${err.message}`, error: true });
    }
  });
  socket.on("battle:forfeit", async ({ battleId, reason }) => {
    try {
      if (!battleId) return;

      const battle = await Battle.findById(battleId).select("status participants roomId");
      if (!battle || battle.status !== "active") return;

      // Make sure the forfeiting user is actually a participant
      const isParticipant = battle.participants.some(
        (p) => p.user.toString() === userId
      );
      if (!isParticipant) return;

      const opponent = battle.participants.find(
        (p) => p.user.toString() !== userId
      );

      clearBattleTimer(battle.roomId);

      if (opponent) {
        // Opponent wins
        await endBattle(battle._id, opponent.user.toString(), reason || "forfeit", io);
      } else {
        // No opponent (shouldn't happen in 1v1 but guard anyway)
        await endBattle(battle._id, null, reason || "forfeit", io);
      }
    } catch (err) {
      console.error("[battle:forfeit]", err.message);
      socket.emit("battle:error", { message: err.message });
    }
  });
  socket.on("disconnecting", async () => {
    // Find which battle room this socket is in (if any)
    const battleRoom = [...socket.rooms].find((r) => r !== socket.id);
    if (!battleRoom) return;

    try {
      const battle = await Battle.findOne({
        roomId: battleRoom,
        status: "active",
      }).select("_id participants roomId");

      if (!battle) return;

      // Clear any existing grace timer for this user before setting a new one
      if (disconnectTimers.has(userId)) {
        clearTimeout(disconnectTimers.get(userId));
        disconnectTimers.delete(userId);
      }

      socket.to(battleRoom).emit("battle:opponent_disconnected", {
        userId,
        username:        socket.user.username,
        reconnectWindow: 30,
      });

      // 30-second grace window: if the user reconnects and emits battle:rejoin,
      // the timer above is cancelled. Otherwise the opponent wins by disconnect.
      const timer = setTimeout(async () => {
        disconnectTimers.delete(userId);
        try {
          const freshBattle = await Battle.findById(battle._id).select("status participants roomId");
          if (freshBattle?.status !== "active") return;

          const opponent = freshBattle.participants.find(
            (p) => p.user.toString() !== userId
          );

          clearBattleTimer(battleRoom);

          if (opponent) {
            await endBattle(freshBattle._id, opponent.user.toString(), "disconnect", io);
          } else {
            await endBattle(freshBattle._id, null, "disconnect", io);
          }

          // Also clear stale currentBattleId for the disconnected user
          await User.findByIdAndUpdate(userId, { currentBattleId: null });
        } catch (e) {
          console.error("[disconnect grace]", e.message);
        }
      }, 30_000);

      disconnectTimers.set(userId, timer);
    } catch (err) {
      console.error("[disconnecting]", err.message);
    }
  });
};

export default battleHandler;
