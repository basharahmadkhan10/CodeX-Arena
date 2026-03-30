import MatchmakingService from "../service/matchmaking.service.js";
import User from "../models/User.js";
import Battle from "../models/Battle.js";

const matchmakingHandler = (io, socket) => {
  const userId = socket.user._id.toString();

  socket.on("matchmaking:join", async () => {
    try {
      // Always fetch fresh from DB
      const freshUser = await User.findById(userId).select("currentBattleId username rating");
      if (!freshUser) return;

      // Check if truly in an active battle
      if (freshUser.currentBattleId) {
        const activeBattle = await Battle.findOne({
          _id: freshUser.currentBattleId,
          status: "active",
        });

        if (activeBattle) {
          socket.emit("matchmaking:error", { message: "You are already in an active battle." });
          return;
        }
        // Stale — clear it
        await User.findByIdAndUpdate(userId, { currentBattleId: null });
      }

      // Already in queue — just update socket ID and re-confirm
      if (MatchmakingService.isInQueue(userId)) {
        MatchmakingService.updateSocketId(userId, socket.id);
        socket.emit("matchmaking:queued", {
          position: MatchmakingService.getQueuePosition(userId),
          message: "Already searching...",
        });
        return;
      }

      socket.emit("matchmaking:queued", {
        position: MatchmakingService.getQueueSize() + 1,
        message: "In queue — finding opponent...",
      });

      await MatchmakingService.addToQueue(userId, socket.id, freshUser.username, freshUser.rating);
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
    // Pass socket.id so service can ignore stale disconnect calls
    MatchmakingService.removeFromQueue(userId, socket.id);
  });
};

export default matchmakingHandler;
