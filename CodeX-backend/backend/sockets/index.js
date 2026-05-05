import socketAuthMiddleware from "./auth.middleware.js";
import matchmakingHandler from "./matchmaking.socket.js";
import battleHandler from "./battle.socket.js";
import roomHandler from "./room.socket.js";
import User from "../models/User.js";
import Battle from "../models/Battle.js";
import MatchmakingService from "../service/matchmaking.service.js";

// userId → socketId — always the latest connected socket
const userSocketMap = new Map();

const socketHandler = (io) => {
  io.use(socketAuthMiddleware);

  io.on("connection", async (socket) => {
    const user   = socket.user;
    const userId = user._id.toString();

    const prevSocketId = userSocketMap.get(userId);

    if (prevSocketId && prevSocketId !== socket.id) {
      const prevSocket = io.sockets.sockets.get(prevSocketId);

      if (prevSocket?.connected) {
        // DO NOT call prevSocket.disconnect(true) — that fires "io server disconnect"
        // on the client which triggers reconnect → new connection → kills that socket
        // → infinite loop. Instead strip listeners so the old socket dies on its own
        // via ping timeout (~60s). The new socket takes over immediately.
        prevSocket.removeAllListeners();
        console.log(`⚠️  Ghost old socket for ${user.username} [${prevSocketId}] → new [${socket.id}]`);
      }

      MatchmakingService.updateSocketId(userId, socket.id);

      // Auto-rejoin battle room on reconnect so user doesn't lose their battle
      try {
        const activeBattle = await Battle.findOne({
          "participants.user": user._id,
          status:              "active",
        }).select("roomId");

        if (activeBattle?.roomId) {
          socket.join(activeBattle.roomId);
          console.log(`🔄 Auto-rejoined room ${activeBattle.roomId} for ${user.username}`);
        }
      } catch (err) {
        console.error("[socketHandler] auto-rejoin error:", err.message);
      }
    }

    userSocketMap.set(userId, socket.id);
    console.log(`✅ Connected: ${user.username} [${socket.id}]`);

    matchmakingHandler(io, socket);
    battleHandler(io, socket);
    roomHandler(io, socket);

    socket.on("disconnect", async (reason) => {
      // Only clean up if this is still the active socket (not a ghost)
      if (userSocketMap.get(userId) !== socket.id) return;

      userSocketMap.delete(userId);
      console.log(`🔌 Disconnected: ${user.username} [${socket.id}] — ${reason}`);

      try {
        await User.findByIdAndUpdate(user._id, {
          isOnline: false,
          lastSeen: new Date(),
        });
      } catch { /* non-critical */ }
    });
  });
};

export default socketHandler;
