/** @format */

import Battle from "../models/Battle.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";
import { executeCode } from "../service/codeExecution.service.js";
import { runTestCases } from "../service/codeExecution.service.js";

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

const RATING = { WIN: 25, LOSS: -15, DRAW: 5 };

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

// ── End a ROOM battle with 4 questions ──────────────────────────────────────
async function endRoomBattleWithQuestions(battleId, winnerId, reason, io) {
  const battle = await Battle.findById(battleId).populate("participants.user");
  if (!battle || battle.status !== "active") return;

  battle.status = "completed";
  battle.endedAt = new Date();
  battle.duration = Math.floor((battle.endedAt - battle.startedAt) / 1000);
  battle.endReason = reason;

  if (reason === "timeout") {
    // Winner = most solved questions, then most test cases passed
    let maxSolved = -1;
    let maxPassed = -1;
    let topUserId = null;
    let isTie = false;

    for (const p of battle.participants) {
      const solvedCount = p.solvedCount || 0;
      const totalPassed = p.questionResults?.reduce((sum, qr) => sum + (qr.passed || 0), 0) || 0;
      
      if (solvedCount > maxSolved || (solvedCount === maxSolved && totalPassed > maxPassed)) {
        maxSolved = solvedCount;
        maxPassed = totalPassed;
        topUserId = (p.user._id || p.user).toString();
        isTie = false;
      } else if (solvedCount === maxSolved && totalPassed === maxPassed && maxSolved !== -1) {
        isTie = true;
      }
    }

    battle.winner = isTie || maxSolved === 0 ? null : topUserId;

    for (const p of battle.participants) {
      const uid = (p.user._id || p.user).toString();
      if (!battle.winner) {
        p.ratingChange = RATING.DRAW;
      } else if (uid === battle.winner.toString()) {
        p.ratingChange = RATING.WIN;
      } else {
        p.ratingChange = RATING.LOSS;
      }
    }
  } else {
    // all_solved / forfeit / disconnect → explicit winner
    battle.winner = winnerId;
    for (const p of battle.participants) {
      const uid = (p.user._id || p.user).toString();
      p.ratingChange = uid === winnerId?.toString() ? RATING.WIN : RATING.LOSS;
    }
  }

  await battle.save();

  // Update every participant's stats + rating
  for (const participant of battle.participants) {
    const uid = participant.user._id || participant.user;
    const u = await User.findById(uid);
    if (!u) continue;

    u.rating = Math.max(0, u.rating + participant.ratingChange);
    u.totalBattles += 1;
    u.currentBattleId = null;

    const wid = battle.winner?.toString();
    if (!battle.winner) u.draws += 1;
    else if (wid === uid.toString()) u.wins += 1;
    else u.losses += 1;

    if (typeof u.updateRank === "function") u.updateRank();
    await u.save();
  }

  // Emit result to every socket in the room
  io.to(battle.roomId).emit("room:battle_ended", {
    winnerId: battle.winner?.toString() || null,
    reason,
    duration: battle.duration,
    totalQuestions: battle.problems?.length || 4,
    participants: battle.participants.map((p) => ({
      userId: (p.user._id || p.user).toString(),
      username: p.user.username || "Player",
      ratingChange: p.ratingChange,
      solvedCount: p.solvedCount || 0,
      questionResults: p.questionResults || [],
    })),
  });

  console.log(`🏁 Room Battle [${battle.roomId}] ended — ${reason} — Winner: ${battle.winner}`);
}

// ── Submit solution for a specific question in room battle ───────────────────
async function submitRoomQuestion(battleId, userId, questionIndex, code, language, io) {
  const battle = await Battle.findById(battleId).populate("problems");
  if (!battle) throw new Error("Battle not found");
  if (!battle.isRoomBattle) throw new Error("Not a room battle");
  if (battle.status !== "active") throw new Error("Battle is no longer active");

  const participant = battle.participants.find(p => p.user.toString() === userId);
  if (!participant) throw new Error("You are not a participant");
  
  // Check if already solved this question
  const alreadySolved = participant.questionResults?.find(
    qr => qr.questionIndex === questionIndex && qr.status === "AC"
  );
  if (alreadySolved) throw new Error("Question already solved");

  const problem = battle.problems[questionIndex];
  if (!problem) throw new Error("Question not found");

  const { testCases } = problem;
  const { passed, total, status, results, errorMessage } = await runTestCases(
    code,
    language,
    testCases,
  );

  // Update participant's result
  const existingResult = participant.questionResults?.find(
    qr => qr.questionIndex === questionIndex
  );
  
  if (existingResult) {
    existingResult.status = status;
    existingResult.passed = passed;
    existingResult.total = total;
    existingResult.submittedAt = new Date();
    existingResult.code = code;
    existingResult.language = language;
    existingResult.errorMessage = errorMessage;
  } else {
    if (!participant.questionResults) participant.questionResults = [];
    participant.questionResults.push({
      questionIndex,
      status,
      passed,
      total,
      submittedAt: new Date(),
      code,
      language,
      errorMessage,
    });
  }
  
  // Update solved count
  participant.solvedCount = participant.questionResults.filter(qr => qr.status === "AC").length;
  await battle.save();

  // Broadcast update
  io.to(battle.roomId).emit("room:submission_update", {
    userId,
    questionIndex,
    status,
    passed,
    total,
    solvedCount: participant.solvedCount,
  });

  // Check if all questions solved
  if (participant.solvedCount === battle.problems.length) {
    await endRoomBattleWithQuestions(battle._id, userId, "all_solved", io);
  }

  return { status, passed, total, results, errorMessage };
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

  // ── Start Battle (host only) - UPDATED for 4 questions ──────────────────────
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
      // Get 4 RANDOM problems from database
      const problemCount = await Problem.countDocuments({ isActive: true });
      
      if (problemCount < 4) {
        room.status = "waiting";
        socket.emit("room:error", {
          message: `Need at least 4 problems, but only ${problemCount} available.`,
        });
        return;
      }

      // Get 4 random problems using aggregation
      const problems = await Problem.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 4 } }
      ]);

      if (!problems || problems.length < 4) {
        room.status = "waiting";
        socket.emit("room:error", {
          message: "Failed to get 4 problems. Try again.",
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

      // Create battle with 4 problems
      const battle = await Battle.create({
        roomId: code,
        status: "active",
        problems: problems.map(p => p._id),
        isRoomBattle: true,
        participants: allMembers.map((m) => ({
          user: m.userId,
          socketId: m.socketId,
          questionResults: [],
          solvedCount: 0,
        })),
        startedAt: new Date(),
        timeLimit: TIME_LIMIT,
      });

      room.status = "in_battle";
      room.battleId = battle._id.toString();

      // Update all participants with current battle ID
      await User.updateMany(
        { _id: { $in: allMembers.map((m) => m.userId) } },
        { $set: { currentBattleId: battle._id } },
      );

      // Format all 4 problems for frontend
      const clientQuestions = problems.map((problem, index) => ({
        id: problem._id,
        order: index,
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
        sampleTestCases: problem.sampleTestCases || [],
        totalTestCases: (problem.testCases || []).length,
      }));

      // Emit battle started with 4 questions
      io.to(code).emit("room:battle_started", {
        battleId: battle._id.toString(),
        roomId: code,
        questions: clientQuestions,
        participants: allMembers.map((m) => ({
          userId: m.userId,
          username: m.username,
        })),
        timeLimit: TIME_LIMIT,
        startedAt: battle.startedAt,
      });

      console.log(
        `⚔️ Room battle started: ${code} | ${allMembers.length} players | 4 questions`
      );

      // Auto-end on timeout (45 minutes)
      const timer = setTimeout(async () => {
        roomTimers.delete(code);
        try {
          const fresh = await Battle.findById(battle._id);
          if (fresh?.status === "active") {
            await endRoomBattleWithQuestions(battle._id, null, "timeout", io);
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

  // ── Submit Code for specific question - UPDATED ──────────────────────────────
  socket.on("room:submit", async ({ battleId, code, language, questionIndex }) => {
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
      const result = await submitRoomQuestion(
        battleId,
        userId,
        questionIndex,
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

      await endRoomBattleWithQuestions(battle._id, otherId || null, "forfeit", io);
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
              await endRoomBattleWithQuestions(
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
