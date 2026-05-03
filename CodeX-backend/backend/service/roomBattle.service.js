import Battle from "../models/Battle.js";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import { runTestCases } from "./codeExecution.service.js";

const RATING = { WIN: 25, LOSS: -15, DRAW: 5 };

// ── Submit solution for ROOM battles ────────────────────────────────────────
// Works for 2-10 players. First to AC wins immediately.
export const submitRoomSolution = async (
  battleId,
  userId,
  code,
  language,
  io,
) => {
  const battle = await Battle.findById(battleId).populate("problem");
  if (!battle) throw new Error("Battle not found");
  if (battle.status !== "active") throw new Error("Battle is no longer active");

  const participant = battle.participants.find(
    (p) => p.user.toString() === userId,
  );
  if (!participant) throw new Error("You are not a participant");
  if (participant.result?.status === "AC") throw new Error("Already solved");

  const { testCases } = battle.problem;
  const { passed, total, status, results, errorMessage } = await runTestCases(
    code,
    language,
    testCases,
  );

  participant.code = code;
  participant.language = language;
  participant.submittedAt = new Date();
  participant.result = {
    passed,
    total,
    status,
    errorMessage: errorMessage || null,
  };
  await battle.save();

  // Broadcast live status update to entire room
  io.to(battle.roomId).emit("room:submission_update", {
    userId,
    status,
    passed,
    total,
    language,
  });

  // First AC wins the whole room battle
  if (status === "AC") {
    await endRoomBattle(battle._id, userId, "solved", io);
  }

  return { status, passed, total, results, errorMessage };
};

// ── End a ROOM battle (supports 2-10 players) ───────────────────────────────
export const endRoomBattle = async (battleId, winnerId, reason, io) => {
  const battle = await Battle.findById(battleId).populate("participants.user");
  if (!battle || battle.status !== "active") return;

  battle.status = "completed";
  battle.endedAt = new Date();
  battle.duration = Math.floor((battle.endedAt - battle.startedAt) / 1000);
  battle.endReason = reason;

  if (reason === "timeout") {
    // Winner = most test cases passed; ties → null (draw)
    let maxPassed = -1;
    let topUserId = null;
    let isTie = false;

    for (const p of battle.participants) {
      const passed = p.result?.passed || 0;
      if (passed > maxPassed) {
        maxPassed = passed;
        topUserId = (p.user._id || p.user).toString();
        isTie = false;
      } else if (passed === maxPassed) {
        isTie = true;
      }
    }

    battle.winner = isTie || maxPassed === 0 ? null : topUserId;

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
    // solved / forfeit / disconnect → explicit winner
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

  if (reason === "solved" && battle.problem) {
    await Problem.findByIdAndUpdate(battle.problem, {
      $inc: { solveCount: 1 },
    });
  }

  // Emit result to every socket in the room
  io.to(battle.roomId).emit("room:battle_ended", {
    winnerId: battle.winner?.toString() || null,
    reason,
    duration: battle.duration,
    participants: battle.participants.map((p) => ({
      userId: (p.user._id || p.user).toString(),
      username: p.user.username || "Player",
      ratingChange: p.ratingChange,
      result: p.result,
      passed: p.result?.passed || 0,
      total: p.result?.total || 0,
      status: p.result?.status || "pending",
    })),
  });

  console.log(`🏁 Room Battle [${battle.roomId}] ended — ${reason}`);
};
