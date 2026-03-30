import Battle from "../models/Battle.js";
import Problem from "../models/Problem.js";
import MatchmakingService from "../service/matchmaking.service.js";
import { clearBattleTimer } from "../service/matchmaking.service.js";
import { endBattle } from "../service/battle.service.js";

// roomCode → { hostId, hostUsername, guests: [{userId, username, socketId}], status }
const privateRooms = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const roomHandler = (io, socket) => {
  const userId = socket.user._id.toString();
  const username = socket.user.username;

  // ── Create Room ──────────────────────────────────────────────────
  socket.on("room:create", () => {
    // Clean up any existing room this user hosts
    for (const [code, room] of privateRooms.entries()) {
      if (room.hostId === userId) {
        io.to(code).emit("room:closed", { message: "Host opened a new room." });
        privateRooms.delete(code);
      }
    }

    let code;
    do {
      code = generateRoomCode();
    } while (privateRooms.has(code));

    privateRooms.set(code, {
      code,
      hostId: userId,
      hostUsername: username,
      hostSocketId: socket.id,
      guests: [],
      status: "waiting", // waiting | starting | in_battle
    });

    socket.join(code);
    socket.emit("room:created", {
      code,
      members: [{ userId, username, isHost: true }],
    });
    console.log(`🔗 Room created: ${code} by ${username}`);
  });

  // ── Join Room ────────────────────────────────────────────────────
  socket.on("room:join", ({ code }) => {
    const room = privateRooms.get(code?.toUpperCase());

    if (!room) {
      socket.emit("room:error", {
        message: "Room not found. Check the code and try again.",
      });
      return;
    }
    if (room.status !== "waiting") {
      socket.emit("room:error", {
        message: "Battle already started in this room.",
      });
      return;
    }
    if (room.hostId === userId) {
      // Host rejoining — just re-sync
      socket.join(code);
      const members = buildMemberList(room);
      socket.emit("room:joined", { code, members, isHost: true });
      return;
    }
    if (room.guests.length >= 9) {
      socket.emit("room:error", { message: "Room is full (max 10 players)." });
      return;
    }

    // Remove if already in guests (reconnect)
    room.guests = room.guests.filter((g) => g.userId !== userId);
    room.guests.push({ userId, username, socketId: socket.id });

    socket.join(code);

    const members = buildMemberList(room);

    // Tell the joiner
    socket.emit("room:joined", { code, members, isHost: false });

    // Tell everyone else in the room
    socket.to(code).emit("room:member_joined", { userId, username, members });

    console.log(`🔗 ${username} joined room ${code}`);
  });

  // ── Leave Room ───────────────────────────────────────────────────
  socket.on("room:leave", ({ code }) => {
    handleLeave(io, socket, userId, username, code, privateRooms);
  });

  // ── Start Battle (host only) ─────────────────────────────────────
  socket.on("room:start", async ({ code }) => {
    const room = privateRooms.get(code);

    if (!room) {
      socket.emit("room:error", { message: "Room not found." });
      return;
    }
    if (room.hostId !== userId) {
      socket.emit("room:error", { message: "Only the host can start." });
      return;
    }
    if (room.guests.length === 0) {
      socket.emit("room:error", {
        message: "Need at least 2 players to start.",
      });
      return;
    }
    if (room.status !== "waiting") {
      socket.emit("room:error", { message: "Battle already started." });
      return;
    }

    room.status = "starting";

    try {
      // Pick a random active problem
      const count = await Problem.countDocuments({ isActive: true });
      const skip = Math.floor(Math.random() * count);
      const problem = await Problem.findOne({ isActive: true })
        .skip(skip)
        .lean();

      if (!problem) {
        room.status = "waiting";
        socket.emit("room:error", {
          message: "No problems available. Try again.",
        });
        return;
      }

      // Build participant list: host + guests
      const allMembers = [
        {
          userId: room.hostId,
          username: room.hostUsername,
          socketId: room.hostSocketId,
        },
        ...room.guests,
      ];

      const TIME_LIMIT = 45 * 60; // 45 min in seconds

      // Create battle in DB
      const battle = await Battle.create({
        roomId: code,
        type: "room",
        status: "active",
        problem: problem._id,
        participants: allMembers.map((m) => ({
          user: m.userId,
          username: m.username,
          socketId: m.socketId,
        })),
        startedAt: new Date(),
        timeLimit: TIME_LIMIT,
      });

      room.status = "in_battle";
      room.battleId = battle._id.toString();

      // Shape problem for client (same as 1v1)
      const clientProblem = {
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        constraints: problem.constraints,
        tags: problem.tags,
        examples: problem.sampleTestCases?.slice(0, 3).map((tc) => ({
          input: tc.input,
          output: tc.output,
          explanation: tc.explanation,
        })),
        sampleTestCases: problem.sampleTestCases,
        totalTestCases: problem.testCases?.length || 0,
      };

      // Emit to every member in the socket room
      io.to(code).emit("room:battle_started", {
        battleId: battle._id.toString(),
        roomId: code,
        problem: clientProblem,
        participants: allMembers.map((m) => ({
          userId: m.userId,
          username: m.username,
        })),
        timeLimit: TIME_LIMIT,
        startedAt: battle.startedAt,
      });

      console.log(
        `⚔️  Room battle started: ${code} | ${allMembers.length} players`,
      );

      // Auto-end after time limit
      const timer = setTimeout(async () => {
        try {
          const fresh = await Battle.findById(battle._id);
          if (fresh?.status === "active") {
            await Battle.findByIdAndUpdate(battle._id, {
              status: "completed",
              endedAt: new Date(),
              endReason: "timeout",
            });
            io.to(code).emit("room:battle_ended", {
              reason: "timeout",
              message: "Time's up!",
            });
          }
        } catch (e) {
          console.error("[room timer]", e.message);
        }
      }, TIME_LIMIT * 1000);

      // Store timer ref so it can be cleared
      MatchmakingService._roomTimers =
        MatchmakingService._roomTimers || new Map();
      MatchmakingService._roomTimers.set(code, timer);
    } catch (err) {
      room.status = "waiting";
      console.error("[room:start]", err.message);
      socket.emit("room:error", {
        message: "Failed to start battle. Try again.",
      });
    }
  });

  // ── Disconnect handling ──────────────────────────────────────────
  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room === socket.id) continue;
      const privateRoom = privateRooms.get(room);
      if (!privateRoom) continue;

      if (privateRoom.hostId === userId && privateRoom.status === "waiting") {
        // Host left waiting room → close it
        socket.to(room).emit("room:closed", { message: "Host left the room." });
        privateRooms.delete(room);
      } else {
        // Guest left → remove from list, notify others
        privateRoom.guests = privateRoom.guests.filter(
          (g) => g.userId !== userId,
        );
        const members = buildMemberList(privateRoom);
        socket.to(room).emit("room:member_left", { userId, username, members });
      }
    }
  });
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildMemberList(room) {
  return [
    { userId: room.hostId, username: room.hostUsername, isHost: true },
    ...room.guests.map((g) => ({
      userId: g.userId,
      username: g.username,
      isHost: false,
    })),
  ];
}

function handleLeave(io, socket, userId, username, code, privateRooms) {
  const room = privateRooms.get(code);
  if (!room) return;

  if (room.hostId === userId) {
    io.to(code).emit("room:closed", { message: "Host closed the room." });
    privateRooms.delete(code);
  } else {
    room.guests = room.guests.filter((g) => g.userId !== userId);
    const members = buildMemberList(room);
    socket.to(code).emit("room:member_left", { userId, username, members });
    socket.emit("room:left");
    socket.leave(code);
  }
}

export default roomHandler;
