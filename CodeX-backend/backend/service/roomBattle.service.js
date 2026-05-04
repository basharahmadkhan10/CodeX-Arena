import Battle from "../models/Battle.js";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import { runTestCases } from "./codeExecution.service.js";

const RATING = { WIN: 25, LOSS: -15, DRAW: 5 };

// ── Get random problems for room battle ─────────────────────────────────────
export const getRandomProblems = async (count = 4) => {
  const problems = await Problem.aggregate([
    { $match: { isActive: true } },
    { $sample: { size: count } }
  ]);
  
  if (problems.length < count) {
    throw new Error(`Only ${problems.length} problems available, need ${count}`);
  }
  
  return problems;
};

// ── Start a ROOM battle with 4 questions ────────────────────────────────────
export const startRoomBattle = async (roomId, participants, timeLimit = 2700) => {
  // Get 4 random problems from database
  const problems = await getRandomProblems(4);
  
  const battle = new Battle({
    roomId: roomId,
    problems: problems.map(p => p._id),
    isRoomBattle: true,
    participants: participants.map(p => ({
      user: p.userId,
      questionResults: [],
      solvedCount: 0,
      isConnected: true
    })),
    status: "active",
    startedAt: new Date(),
    timeLimit: timeLimit,
  });
  
  await battle.save();
  
  // Populate problems for response
  await battle.populate("problems", "title description difficulty examples constraints tags testCases");
  
  // Format for frontend
  return {
    battleId: battle._id,
    roomId: battle.roomId,
    questions: battle.problems.map((p, idx) => ({
      id: p._id,
      title: p.title,
      difficulty: p.difficulty,
      tags: p.tags,
      description: p.description,
      constraints: p.constraints,
      examples: p.examples,
      sampleTestCases: p.testCases.filter(tc => tc.isPublic),
      totalTestCases: p.testCases.length,
      order: idx
    })),
    participants: participants.map(p => ({
      userId: p.userId,
      username: p.username
    })),
    timeLimit: timeLimit
  };
};

// ── Submit solution for ROOM battles (4 questions mode) ────────────────────
export const submitRoomQuestion = async (
  battleId,
  userId,
  questionIndex,
  code,
  language,
  io,
) => {
  const battle = await Battle.findById(battleId).populate("problems");
  if (!battle) throw new Error("Battle not found");
  if (!battle.isRoomBattle) throw new Error("Not a room battle");
  if (battle.status !== "active") throw new Error("Battle is no longer active");

  const participant = battle.participants.find(
    (p) => p.user.toString() === userId,
  );
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

  // Update participant's result for this question
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
    existingResult.errorMessage = errorMessage || null;
  } else {
    participant.questionResults.push({
      questionIndex,
      status,
      passed,
      total,
      submittedAt: new Date(),
      code,
      language,
      errorMessage: errorMessage || null,
    });
  }
  
  // Update solved count
  participant.solvedCount = participant.questionResults.filter(
    qr => qr.status === "AC"
  ).length;
  
  await battle.save();

  // Broadcast live status update to entire room
  io.to(battle.roomId).emit("room:submission_update", {
    userId,
    questionIndex,
    status,
    passed,
    total,
    solvedCount: participant.solvedCount,
    language,
  });

  // Check if player solved ALL questions
  if (participant.solvedCount === battle.problems.length) {
    await endRoomBattleWithQuestions(battle._id, userId, "all_solved", io);
  }

  return { status, passed, total, results, errorMessage };
};

// ── End a ROOM battle with 4 questions ──────────────────────────────────────
export const endRoomBattleWithQuestions = async (battleId, winnerId, reason, io) => {
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
    totalQuestions: battle.problems.length,
    participants: battle.participants.map((p) => ({
      userId: (p.user._id || p.user).toString(),
      username: p.user.username || "Player",
      ratingChange: p.ratingChange,
      solvedCount: p.solvedCount || 0,
      questionResults: p.questionResults || [],
    })),
  });

  console.log(`🏁 Room Battle [${battle.roomId}] ended — ${reason} — Winner: ${battle.winner}`);
};
