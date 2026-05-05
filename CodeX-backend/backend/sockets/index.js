import socketAuthMiddleware from "./auth.middleware.js";
import matchmakingHandler from "./matchmaking.socket.js";
import battleHandler from "./battle.socket.js";
import roomHandler from "./room.socket.js";
import User from "../models/User.js";
import MatchmakingService from "../service/matchmaking.service.js";
import Battle from "../models/Battle.js";

// userId → socketId  (always reflects the LATEST connected socket)
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
        // ── Do NOT call prevSocket.disconnect(true) ──────────────────
        // That fires "io server disconnect" on the client, which
        // triggers the client reconnect logic, which creates a new
        // socket, which connects here again → infinite loop.
        //
        // Instead: silently strip listeners from the old socket so it
        // becomes a ghost that will die on its own (ping timeout ~60s).
        // The user's active session is now the new socket.
        prevSocket.removeAllListeners();
        console.log(
          `⚠️  Ghost old socket for ${user.username} [${prevSocketId}] — new: [${socket.id}]`
        );
      }

      // Keep the matchmaking queue entry pointing at the new socket
      MatchmakingService.updateSocketId(userId, socket.id);

      // If user had an active battle, silently rejoin the room on the new socket
      // so they don't lose their battle state after a natural reconnect
      try {
        const activeBattle = await Battle.findOne({
          "participants.user": user._id,
          status: "active",
        }).select("roomId");

        if (activeBattle?.roomId) {
          socket.join(activeBattle.roomId);
          console.log(
            `🔄 Auto-rejoined battle room ${activeBattle.roomId} for ${user.username}`
          );
        }
      } catch (err) {
        console.error("[socketHandler] auto-rejoin error:", err.message);
      }
    }

    userSocketMap.set(userId, socket.id);
    console.log(`✅ Connected: ${user.username} [${socket.id}]`);

    // Register feature handlers
    matchmakingHandler(io, socket);
    battleHandler(io, socket);
    roomHandler(io, socket);

    socket.on("disconnect", async (reason) => {
      // Only clean up if this is still the active socket for this user
      // (not a stale ghost socket that already had listeners stripped)
      if (userSocketMap.get(userId) !== socket.id) return;

      userSocketMap.delete(userId);
      console.log(`🔌 Disconnected: ${user.username} [${socket.id}] — ${reason}`);

      try {
        await User.findByIdAndUpdate(user._id, {
          isOnline: false,
          lastSeen: new Date(),
        });
      } catch {
        // non-critical
      }
    });
  });
};

export default socketHandler;
