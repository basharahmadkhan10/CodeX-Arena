import { submitSolution, endBattle } from "../service/battle.service.js";
import { executeCode } from "../service/codeExecution.service.js";
import { clearBattleTimer } from "../service/matchmaking.service.js";
import Battle from "../models/Battle.js";

const disconnectTimers = new Map();

const submitCooldowns = new Map();
const runCooldowns = new Map();

const SUBMIT_COOLDOWN_MS = 10_000;
const RUN_COOLDOWN_MS = 3_000;

function canDo(map, userId, cooldownMs) {
  const last = map.get(userId) || 0;
  if (Date.now() - last < cooldownMs) return false;
  map.set(userId, Date.now());
  return true;
}

const battleHandler = (io, socket) => {
  const userId = socket.user._id.toString();

  // ─── REMOVED: battle:join_room ────────────────────────────────────────────
  // Server already joins both sockets in matchmaking._createBattle().
  // Client was emitting this after reconnect with a NEW socket ID, which
  // caused the 404 error in logs and broke room membership.
  // Use battle:rejoin instead (see below).

  // ─── NEW: battle:rejoin ───────────────────────────────────────────────────
  // Called by client after a socket reconnect to re-enter their battle room.
  socket.on("battle:rejoin", async ({ roomId, battleId }) => {
    try {
      if (!roomId || !battleId) return;

      const battle = await Battle.findById(battleId);
      if (!battle || battle.status !== "active") {
        socket.emit("battle:error", { message: "Battle is no longer active." });
        return;
      }

      // Make sure this user is actually a participant
      const isParticipant = battle.participants.some(
        (p) => p.user.toString() === userId
      );
      if (!isParticipant) {
        socket.emit("battle:error", { message: "Not a participant in this battle." });
        return;
      }

      // Rejoin the socket.io room
      socket.join(roomId);
      console.log(`🔄 [${roomId}] ${socket.user.username} rejoined after reconnect`);

      // Cancel any pending disconnect-forfeit timer for this user
      if (disconnectTimers.has(roomId)) {
        clearTimeout(disconnectTimers.get(roomId));
        disconnectTimers.delete(roomId);
        console.log(`[disconnect grace] Cancelled for ${socket.user.username} — they reconnected`);
      }

      // Tell opponent they're back
      socket.to(roomId).emit("battle:opponent_reconnected", {
        userId,
        username: socket.user.username,
      });

      // Ack to client
      socket.emit("battle:rejoined", { roomId, battleId });
    } catch (err) {
      console.error("[battle:rejoin]", err.message);
      socket.emit("battle:error", { message: "Failed to rejoin battle." });
    }
  });

  // ─── battle:submit ────────────────────────────────────────────────────────
  socket.on("battle:submit", async ({ battleId, code, language }) => {
    if (!canDo(submitCooldowns, userId, SUBMIT_COOLDOWN_MS)) {
      socket.emit("battle:error", {
        message: "Please wait before submitting again.",
      });
      return;
    }

    socket.emit("battle:submission_pending");

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
        const battle = await Battle.findById(battleId);
        if (battle?.status === "completed") clearBattleTimer(battle.roomId);
      }
    } catch (err) {
      socket.emit("battle:error", { message: err.message });
    }
  });

  // ─── battle:run_code ──────────────────────────────────────────────────────
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
      socket.emit("battle:run_result", {
        output: `Error: ${err.message}`,
        error: true,
      });
    }
  });

  // ─── battle:forfeit ───────────────────────────────────────────────────────
  socket.on("battle:forfeit", async ({ battleId }) => {
    try {
      const battle = await Battle.findById(battleId);
      if (!battle || battle.status !== "active") return;

      const opponent = battle.participants.find(
        (p) => p.user.toString() !== userId
      );
      if (opponent) {
        clearBattleTimer(battle.roomId);
        await endBattle(battle._id, opponent.user.toString(), "forfeit", io);
      }
    } catch (err) {
      socket.emit("battle:error", { message: err.message });
    }
  });

  // ─── disconnecting ────────────────────────────────────────────────────────
  socket.on("disconnecting", async () => {
    const battleRoom = [...socket.rooms].find((r) => r !== socket.id);
    if (!battleRoom) return;

    try {
      const battle = await Battle.findOne({
        roomId: battleRoom,
        status: "active",
      });
      if (!battle) return;

      // Clear any existing grace timer before setting a new one
      if (disconnectTimers.has(battleRoom)) {
        clearTimeout(disconnectTimers.get(battleRoom));
        disconnectTimers.delete(battleRoom);
      }

      socket.to(battleRoom).emit("battle:opponent_disconnected", {
        userId,
        username: socket.user.username,
        reconnectWindow: 30,
      });

      // Give 30s grace window — if they reconnect (battle:rejoin), timer is cancelled
      const timer = setTimeout(async () => {
        disconnectTimers.delete(battleRoom);
        try {
          const freshBattle = await Battle.findById(battle._id);
          if (freshBattle?.status !== "active") return;

          const opponent = freshBattle.participants.find(
            (p) => p.user.toString() !== userId
          );
          if (opponent) {
            clearBattleTimer(battleRoom);
            await endBattle(
              freshBattle._id,
              opponent.user.toString(),
              "disconnect",
              io
            );
          }
        } catch (e) {
          console.error("[disconnect grace]", e.message);
        }
      }, 30_000);

      disconnectTimers.set(battleRoom, timer);
    } catch (err) {
      console.error("[disconnecting]", err.message);
    }
  });
};

export default battleHandler;
