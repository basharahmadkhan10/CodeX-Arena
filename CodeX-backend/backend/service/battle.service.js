import Battle from "../models/Battle.js";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import { runTestCases } from "./codeExecution.service.js";
import { clearBattleTimer } from "./matchmaking.service.js";

const RATING = { WIN: 55, LOSS: -25, DRAW: 5 };

// ── Submit solution ───────────────────────────────────────────────────────────
export const submitSolution = async (battleId, userId, code, language, io) => {
  const battle = await Battle.findById(battleId).populate("problem");
  if (!battle)                      throw new Error("Battle not found");
  if (battle.status !== "active")   throw new Error("Battle is no longer active");

  const participant = battle.participants.find((p) => p.user.toString() === userId);
  if (!participant)                 throw new Error("You are not a participant");
  if (participant.result?.status === "AC") throw new Error("Already solved");

  const { testCases } = battle.problem;
  const { passed, total, status, results, errorMessage } = await runTestCases(
    code,
    language,
    testCases,
  );

  participant.code        = code;
  participant.language    = language;
  participant.submittedAt = new Date();
  participant.result      = { passed, total, status, errorMessage: errorMessage || null };
  await battle.save();

  // Broadcast submission update to the room (so opponent sees progress)
  io.to(battle.roomId).emit("battle:submission_update", {
    userId,
    status,
    passed,
    total,
    language,
  });

  // FIX: endBattle now clears the timer internally — no need to do it here.
  // Previously this required a second DB query after endBattle which could
  // miss the clearBattleTimer call if an exception occurred before it.
  if (status === "AC") {
    await endBattle(battle._id, userId, "solved", io);
  }

  return { status, passed, total, results, errorMessage };
};

// ── End battle ────────────────────────────────────────────────────────────────
export const endBattle = async (battleId, winnerId, reason, io) => {
  const battle = await Battle.findById(battleId).populate("participants.user");
  if (!battle || battle.status !== "active") return;

  // FIX: clear the server timer FIRST — before any await that could throw —
  // so a double-call (e.g. AC submit + timeout race) never fires twice.
  clearBattleTimer(battle.roomId);

  battle.status   = "completed";
  battle.endedAt  = new Date();
  battle.duration = Math.floor((battle.endedAt - battle.startedAt) / 1000);
  battle.endReason = reason;

  const [p1, p2] = battle.participants;

  if (reason === "timeout") {
    const p1Passed = p1.result?.passed || 0;
    const p2Passed = p2.result?.passed || 0;

    if (p1Passed > p2Passed) {
      battle.winner    = p1.user._id || p1.user;
      p1.ratingChange  = RATING.WIN;
      p2.ratingChange  = RATING.LOSS;
    } else if (p2Passed > p1Passed) {
      battle.winner    = p2.user._id || p2.user;
      p2.ratingChange  = RATING.WIN;
      p1.ratingChange  = RATING.LOSS;
    } else {
      battle.winner    = null;
      p1.ratingChange  = RATING.DRAW;
      p2.ratingChange  = RATING.DRAW;
    }
  } else {
    battle.winner = winnerId || null;
    for (const p of battle.participants) {
      const pId       = (p.user._id || p.user).toString();
      p.ratingChange  = pId === winnerId?.toString() ? RATING.WIN : RATING.LOSS;
    }
  }

  await battle.save();

  // Update all participants' stats and clear their currentBattleId
  for (const participant of battle.participants) {
    const uid = participant.user._id || participant.user;
    const u   = await User.findById(uid);
    if (!u) continue;

    u.rating         = Math.max(0, u.rating + participant.ratingChange);
    u.totalBattles  += 1;
    u.currentBattleId = null;   // FIX: always clear so next login is clean

    const wid = battle.winner?.toString();
    if (!battle.winner)             u.draws  += 1;
    else if (wid === uid.toString()) u.wins   += 1;
    else                             u.losses += 1;

    if (typeof u.updateRank === "function") u.updateRank();
    await u.save();
  }

  // Increment problem solve count on a real solve
  if (reason === "solved" && battle.problem) {
    await Problem.findByIdAndUpdate(battle.problem, { $inc: { solveCount: 1 } });
  }

  // Emit result to both players
  io.to(battle.roomId).emit("battle:ended", {
    winnerId:     battle.winner?.toString() || null,
    reason,
    duration:     battle.duration,
    participants: battle.participants.map((p) => ({
      userId:       (p.user._id || p.user).toString(),
      username:     p.user.username || "Player",
      ratingChange: p.ratingChange,
      result:       p.result,
      code:         p.code,
      language:     p.language,
    })),
  });

  console.log(`🏁 Battle [${battle.roomId}] ended — ${reason}`);
};

// ── Get battle by ID ──────────────────────────────────────────────────────────
export const getBattleById = (id) =>
  Battle.findById(id)
    .populate("problem", "title description difficulty examples constraints tags starterCode")
    .populate("participants.user", "username rating rank");
