

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

  socket.on("battle:join_room", ({ roomId }) => {
    socket.join(roomId);
    socket.to(roomId).emit("battle:opponent_joined", {
      userId,
      username: socket.user.username,
    });
  });

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
        socket
          .to(room)
          .emit("battle:opponent_submitting", {
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

  socket.on("battle:forfeit", async ({ battleId }) => {
    try {
      const battle = await Battle.findById(battleId);
      if (!battle || battle.status !== "active") return;

      const opponent = battle.participants.find(
        (p) => p.user.toString() !== userId,
      );
      if (opponent) {
        clearBattleTimer(battle.roomId);
        await endBattle(battle._id, opponent.user.toString(), "forfeit", io);
      }
    } catch (err) {
      socket.emit("battle:error", { message: err.message });
    }
  });

  socket.on("disconnecting", async () => {
    const battleRoom = [...socket.rooms].find((r) => r !== socket.id);
    if (!battleRoom) return;

    try {
      const battle = await Battle.findOne({
        roomId: battleRoom,
        status: "active",
      });
      if (!battle) return;

      if (disconnectTimers.has(battleRoom)) {
        clearTimeout(disconnectTimers.get(battleRoom));
        disconnectTimers.delete(battleRoom);
      }

      socket.to(battleRoom).emit("battle:opponent_disconnected", {
        userId,
        username: socket.user.username,
        reconnectWindow: 30,
      });

      const timer = setTimeout(async () => {
        disconnectTimers.delete(battleRoom);
        try {
          const freshBattle = await Battle.findById(battle._id);
          if (freshBattle?.status !== "active") return;

          const opponent = freshBattle.participants.find(
            (p) => p.user.toString() !== userId,
          );
          if (opponent) {
            clearBattleTimer(battleRoom);
            await endBattle(
              freshBattle._id,
              opponent.user.toString(),
              "disconnect",
              io,
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
