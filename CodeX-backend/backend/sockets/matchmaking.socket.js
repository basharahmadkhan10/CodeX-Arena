import MatchmakingService from "../service/matchmaking.service.js";
import User from "../models/User.js";
import Battle from "../models/Battle.js";

const matchmakingHandler = (io, socket) => {
  const userId = socket.user._id.toString();

  socket.on("matchmaking:join", async ({ mode = "classic" } = {}) => {
    try {
  
      const freshUser = await User.findById(userId).select("currentBattleId username rating");
      if (!freshUser) return;

      if (freshUser.currentBattleId) {
        const activeBattle = await Battle.findOne({
          _id: freshUser.currentBattleId,
          status: "active",
        });

        if (activeBattle) {
          socket.emit("matchmaking:error", { message: "You are already in an active battle." });
          return;
        }
       
        await User.findByIdAndUpdate(userId, { currentBattleId: null });
      }
      if (MatchmakingService.isInQueue(userId, mode)) {
        MatchmakingService.updateSocketId(userId, socket.id);
        socket.emit("matchmaking:queued", {
          position: MatchmakingService.getQueuePosition(userId, mode),
          message: "Already searching...",
        });
        return;
      }

      socket.emit("matchmaking:queued", {
        position: MatchmakingService.getQueueSize(mode) + 1,
        message: "In queue — finding opponent...",
      });

      await MatchmakingService.addToQueue(userId, socket.id, freshUser.username, freshUser.rating, mode);
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
