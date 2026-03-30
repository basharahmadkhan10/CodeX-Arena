import socketAuthMiddleware from "./auth.middleware.js";
import matchmakingHandler from "./matchmaking.socket.js";
import battleHandler from "./battle.socket.js";
import User from "../models/User.js";
import MatchmakingService from "../service/matchmaking.service.js";
import roomHandler from "./room.socket.js";

// userId → socketId (only one live socket per user)
const userSocketMap = new Map();

const socketHandler = (io) => {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = socket.user;
    const userId = user._id.toString();

    // Kill previous socket for this user
    const prevSocketId = userSocketMap.get(userId);
    if (prevSocketId && prevSocketId !== socket.id) {
      const prevSocket = io.sockets.sockets.get(prevSocketId);
      if (prevSocket) {
        console.log(`⚠️  Killing old socket for ${user.username} [${prevSocketId}]`);
        prevSocket.removeAllListeners();
        prevSocket.disconnect(true);
      }
      // Update queue entry with new socket
      MatchmakingService.updateSocketId(userId, socket.id);
    }

    userSocketMap.set(userId, socket.id);
    console.log(`🔌 Connected: ${user.username} [${socket.id}]`);

    matchmakingHandler(io, socket);
    battleHandler(io, socket);
    roomHandler(io, socket);

    socket.on("disconnect", async (reason) => {
      // Only clean up if this is still the registered socket
      if (userSocketMap.get(userId) === socket.id) {
        userSocketMap.delete(userId);
        console.log(`🔌 Disconnected: ${user.username} [${socket.id}] — ${reason}`);
        try {
          await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: new Date() });
        } catch {}
      }
    });
  });
};

export default socketHandler;
