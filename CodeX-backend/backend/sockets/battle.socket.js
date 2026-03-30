import { submitSolution, endBattle } from "../service/battle.service.js";
import { executeCode } from "../service/codeExecution.service.js";
import { clearBattleTimer } from "../service/matchmaking.service.js";
import Battle from "../models/Battle.js";

// Grace period timers for disconnect: roomId → TimeoutID
const disconnectTimers = new Map();

const battleHandler = (io, socket) => {
  const userId = socket.user._id.toString();

  // Client confirms room join
  socket.on("battle:join_room", ({ roomId }) => {
    socket.join(roomId);
    socket.to(roomId).emit("battle:opponent_joined", {
      userId,
      username: socket.user.username,
    });
  });

  // Submit code for judging
  socket.on("battle:submit", async ({ battleId, code, language }) => {
    socket.emit("battle:submission_pending");

    // Notify opponent
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("battle:opponent_submitting", { username: socket.user.username });
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

  // Run code against custom input (no test cases)
  socket.on("battle:run_code", async ({ code, language, input }) => {
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

  // Forfeit
  socket.on("battle:forfeit", async ({ battleId }) => {
    try {
      const battle = await Battle.findById(battleId);
      if (!battle || battle.status !== "active") return;

      const opponent = battle.participants.find((p) => p.user.toString() !== userId);
      if (opponent) {
        clearBattleTimer(battle.roomId);
        await endBattle(battle._id, opponent.user.toString(), "forfeit", io);
      }
    } catch (err) {
      socket.emit("battle:error", { message: err.message });
    }
  });

  // Handle disconnect during battle
  socket.on("disconnecting", async () => {
    for (const room of socket.rooms) {
      if (room === socket.id) continue;

      try {
        const battle = await Battle.findOne({ roomId: room, status: "active" });
        if (!battle) continue;

        // Clear any existing grace timer for this room
        if (disconnectTimers.has(room)) {
          clearTimeout(disconnectTimers.get(room));
          disconnectTimers.delete(room);
        }

        // Notify opponent
        socket.to(room).emit("battle:opponent_disconnected", {
          userId,
          username: socket.user.username,
          reconnectWindow: 30,
        });

        // 30-second grace period
        const timer = setTimeout(async () => {
          disconnectTimers.delete(room);
          try {
            const freshBattle = await Battle.findById(battle._id);
            if (freshBattle?.status !== "active") return;

            const opponent = freshBattle.participants.find(
              (p) => p.user.toString() !== userId
            );
            if (opponent) {
              clearBattleTimer(room);
              await endBattle(freshBattle._id, opponent.user.toString(), "disconnect", io);
            }
          } catch (e) {
            console.error("[disconnect grace]", e.message);
          }
        }, 30_000);

        disconnectTimers.set(room, timer);
      } catch (err) {
        console.error("[disconnecting]", err.message);
      }
    }
  });
};

export default battleHandler;
