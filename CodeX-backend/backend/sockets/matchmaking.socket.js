import MatchmakingService from "../service/matchmaking.service.js";
import User from "../models/User.js";
import Battle from "../models/Battle.js";

// Rate limit: max 1 join attempt per 3 seconds per user
const joinCooldowns = new Map();
const JOIN_COOLDOWN_MS = 3_000;

function canJoin(userId) {
  const last = joinCooldowns.get(userId) || 0;
  if (Date.now() - last < JOIN_COOLDOWN_MS) return false;
  joinCooldowns.set(userId, Date.now());
  return true;
}

const matchmakingHandler = (io, socket) => {
  const userId = socket.user._id.toString();

  socket.on("matchmaking:join", async ({ mode = "classic" } = {}) => {
    // Rate limit — prevents DB spam from repeated rapid joins
    if (!canJoin(userId)) {
      socket.emit("matchmaking:error", { message: "Please wait before joining again." });
      return;
    }

    try {
      const freshUser = await User.findById(userId).select("currentBattleId username rating");
      if (!freshUser) return;

      // Check if already in an active battle
      if (freshUser.currentBattleId) {
        const activeBattle = await Battle.findOne({
          _id:    freshUser.currentBattleId,
          status: "active",
        }).select("_id");

        if (activeBattle) {
          socket.emit("matchmaking:error", { message: "You are already in an active battle." });
          return;
        }

        // Stale reference — clear it
        await User.findByIdAndUpdate(userId, { currentBattleId: null });
      }

      // Already in queue — just update socket id and ack
      if (MatchmakingService.isInQueue(userId, mode)) {
        MatchmakingService.updateSocketId(userId, socket.id);
        socket.emit("matchmaking:queued", {
          position: MatchmakingService.getQueuePosition(userId, mode),
          message:  "Already searching...",
        });
        return;
      }

      socket.emit("matchmaking:queued", {
        position:  MatchmakingService.getQueueSize(mode) + 1,
        message:   "In queue — finding opponent...",
      });

      await MatchmakingService.addToQueue(
        userId,
        socket.id,
        freshUser.username,
        freshUser.rating,
        mode,
      );
    } catch (err) {
      console.error("[matchmaking:join]", err.message);
      socket.emit("matchmaking:error", { message: "Failed to join queue. Try again." });
    }
  });

  socket.on("matchmaking:leave", () => {
    MatchmakingService.removeFromQueue(userId, socket.id);
    socket.emit("matchmaking:left", { message: "Left the queue." });
  });

  socket.on("disconnect", () => {
    MatchmakingService.removeFromQueue(userId, socket.id);
  });
};

export default matchmakingHandler;
