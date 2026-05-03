/** @format */

import Battle from "../models/Battle.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";
import {
  submitRoomSolution,
  endRoomBattle,
} from "../service/roomBattle.service.js";
import { executeCode } from "../service/codeExecution.service.js";

// roomCode → { hostId, hostUsername, hostSocketId, guests[], status, battleId }
const privateRooms = new Map();

// roomCode → TimeoutID (auto-end timer)
const roomTimers = new Map();

// roomCode → Map<userId, TimeoutID> (disconnect grace timers)
const disconnectTimers = new Map();

// Rate limiting: userId → last action timestamp
const submitCooldowns = new Map();
const runCooldowns = new Map();

const SUBMIT_COOLDOWN_MS = 10_000; // 10 seconds between submits
const RUN_COOLDOWN_MS = 3_000; // 3 seconds between runs

function canDo(map, userId, cooldownMs) {
  const last = map.get(userId) || 0;
  if (Date.now() - last < cooldownMs) return false;
  map.set(userId, Date.now());
  return true;
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

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

const roomHandler = (io, socket) => {
  const userId = socket.user._id.toString();
  const username = socket.user.username;

  // ── Create Room ────────────────────────────────────────────────────────────
  socket.on("room:create", () => {
    // Close any room this user already hosts
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
      status: "waiting",
      battleId: null,
    });

    socket.join(code);
    socket.emit("room:created", {
      code,
      members: [{ userId, username, isHost: true }],
    });

    console.log(`🔗 Room created: ${code} by ${username}`);
  });

  // ── Join Room ──────────────────────────────────────────────────────────────
  socket.on("room:join", ({ code }) => {
    const upperCode = code?.toUpperCase();
    const room = privateRooms.get(upperCode);

    if (!room) {
      socket.emit("room:error", {
        message: "Room not found. Check the code and try again.",
      });
      return;
    }
    if (room.status === "in_battle") {
      socket.emit("room:error", {
        message: "Battle already started in this room.",
      });
      return;
    }
    if (room.hostId === userId) {
      // Host reconnecting
      room.hostSocketId = socket.id;
      socket.join(upperCode);
      socket.emit("room:joined", {
        code: upperCode,
        members: buildMemberList(room),
        isHost: true,
      });
      return;
    }
    if (room.guests.length >= 9) {
      socket.emit("room:error", { message: "Room is full (max 10 players)." });
      return;
    }

    // Remove stale entry for this user then re-add
    room.guests = room.guests.filter((g) => g.userId !== userId);
    room.guests.push({ userId, username, socketId: socket.id });

    socket.join(upperCode);

    const members = buildMemberList(room);
    socket.emit("room:joined", { code: upperCode, members, isHost: false });
    socket
      .to(upperCode)
      .emit("room:member_joined", { userId, username, members });

    console.log(`🔗 ${username} joined room ${upperCode}`);
  });

  // ── Leave Room ─────────────────────────────────────────────────────────────
  socket.on("room:leave", ({ code }) => {
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
  });

  // ── Start Battle (host only) ───────────────────────────────────────────────
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
      const count = await Problem.countDocuments({ isActive: true });
      const problem = await Problem.findOne({ isActive: true })
        .skip(Math.floor(Math.random() * count))
        .lean();

      if (!problem) {
        room.status = "waiting";
        socket.emit("room:error", {
          message: "No problems available. Try again.",
        });
        return;
      }

      const allMembers = [
        {
          userId: room.hostId,
          username: room.hostUsername,
          socketId: room.hostSocketId,
        },
        ...room.guests,
      ];

      const TIME_LIMIT = 45 * 60; // 45 minutes

      const battle = await Battle.create({
        roomId: code,
        status: "active",
        problem: problem._id,
        participants: allMembers.map((m) => ({
          user: m.userId,
          socketId: m.socketId,
        })),
        startedAt: new Date(),
        timeLimit: TIME_LIMIT,
      });

      room.status = "in_battle";
      room.battleId = battle._id.toString();

      // Single query to update all participants — replaces the sequential loop
      await User.updateMany(
        { _id: { $in: allMembers.map((m) => m.userId) } },
        { $set: { currentBattleId: battle._id } },
      );

      const clientProblem = {
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        constraints: problem.constraints,
        tags: problem.tags,
        examples: (problem.sampleTestCases || []).slice(0, 3).map((tc) => ({
          input: tc.input,
          output: tc.output,
          explanation: tc.explanation,
        })),
        sampleTestCases: problem.sampleTestCases,
        totalTestCases: (problem.testCases || []).length,
      };

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

      // Auto-end on timeout
      const timer = setTimeout(async () => {
        roomTimers.delete(code);
        try {
          const fresh = await Battle.findById(battle._id);
          if (fresh?.status === "active") {
            await endRoomBattle(battle._id, null, "timeout", io);
          }
        } catch (e) {
          console.error("[room timer]", e.message);
        }
      }, TIME_LIMIT * 1000);

      roomTimers.set(code, timer);
    } catch (err) {
      room.status = "waiting";
      console.error("[room:start]", err.message);
      socket.emit("room:error", { message: "Failed to start. Try again." });
    }
  });

  // ── Submit Code ────────────────────────────────────────────────────────────
  socket.on("room:submit", async ({ battleId, code, language }) => {
    if (!canDo(submitCooldowns, userId, SUBMIT_COOLDOWN_MS)) {
      socket.emit("room:error", {
        message: "Please wait before submitting again.",
      });
      return;
    }

    socket.emit("room:submission_pending");

    // Notify others in the room
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("room:opponent_submitting", { userId, username });
      }
    }

    try {
      const result = await submitRoomSolution(
        battleId,
        userId,
        code,
        language,
        io,
      );
      socket.emit("room:submission_result", result);
    } catch (err) {
      socket.emit("room:error", { message: err.message });
    }
  });

  // ── Run Code (custom input) ────────────────────────────────────────────────
  socket.on("room:run_code", async ({ code, language, input }) => {
    if (!canDo(runCooldowns, userId, RUN_COOLDOWN_MS)) {
      socket.emit("room:run_result", {
        output: "Please wait a moment before running again.",
        error: true,
      });
      return;
    }

    try {
      const result = await executeCode(code, language, input || "");
      socket.emit("room:run_result", {
        output: result.output || result.stderr || "(no output)",
        cpuTime: null,
        error: result.exitCode !== 0,
      });
    } catch (err) {
      socket.emit("room:run_result", {
        output: `Error: ${err.message}`,
        error: true,
      });
    }
  });

  // ── Forfeit ────────────────────────────────────────────────────────────────
  socket.on("room:forfeit", async ({ battleId, roomId }) => {
    try {
      const battle = await Battle.findById(battleId);
      if (!battle || battle.status !== "active") return;

      // Clear room timer
      if (roomTimers.has(roomId)) {
        clearTimeout(roomTimers.get(roomId));
        roomTimers.delete(roomId);
      }

      // Find any non-forfeiting participant as winner
      const otherId = battle.participants
        .find((p) => p.user.toString() !== userId)
        ?.user.toString();

      await endRoomBattle(battle._id, otherId || null, "forfeit", io);
    } catch (err) {
      socket.emit("room:error", { message: err.message });
    }
  });

  // ── Disconnect handling ────────────────────────────────────────────────────
  socket.on("disconnecting", async () => {
    for (const room of socket.rooms) {
      if (room === socket.id) continue;

      const privateRoom = privateRooms.get(room);
      if (!privateRoom) continue;

      if (privateRoom.status === "waiting") {
        // Waiting room: host leaves → close, guest leaves → remove
        if (privateRoom.hostId === userId) {
          socket
            .to(room)
            .emit("room:closed", { message: "Host disconnected." });
          privateRooms.delete(room);
        } else {
          privateRoom.guests = privateRoom.guests.filter(
            (g) => g.userId !== userId,
          );
          const members = buildMemberList(privateRoom);
          socket
            .to(room)
            .emit("room:member_left", { userId, username, members });
        }
      } else if (privateRoom.status === "in_battle" && privateRoom.battleId) {
        // In battle: 30-second grace period then forfeit
        socket.to(room).emit("room:opponent_disconnected", {
          userId,
          username,
          reconnectWindow: 30,
        });

        if (!disconnectTimers.has(room)) disconnectTimers.set(room, new Map());
        const roomDcMap = disconnectTimers.get(room);

        if (roomDcMap.has(userId)) {
          clearTimeout(roomDcMap.get(userId));
        }

        const timer = setTimeout(async () => {
          roomDcMap.delete(userId);
          try {
            const battle = await Battle.findById(privateRoom.battleId);
            if (!battle || battle.status !== "active") return;

            // Mark participant as disconnected
            const part = battle.participants.find(
              (p) => p.user.toString() === userId,
            );
            if (part) {
              part.isConnected = false;
              await battle.save();
            }

            // If only one connected participant remains → they win
            const connected = battle.participants.filter(
              (p) => p.isConnected !== false,
            );
            if (connected.length === 1) {
              if (roomTimers.has(room)) {
                clearTimeout(roomTimers.get(room));
                roomTimers.delete(room);
              }
              await endRoomBattle(
                battle._id,
                connected[0].user.toString(),
                "disconnect",
                io,
              );
            }
          } catch (e) {
            console.error("[room disconnect grace]", e.message);
          }
        }, 30_000);

        roomDcMap.set(userId, timer);
      }
    }
  });
};

export default roomHandler;
