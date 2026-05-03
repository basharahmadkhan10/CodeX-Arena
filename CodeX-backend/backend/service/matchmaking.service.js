import { v4 as uuidv4 } from "uuid";
import Battle from "../models/Battle.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";

// Shared timer map — roomId → TimeoutID
const battleTimers = new Map();

export const startBattleTimer = (io, roomId, battleId) => {
  if (battleTimers.has(roomId)) return;
  const timer = setTimeout(async () => {
    try {
      const battle = await Battle.findById(battleId);
      if (battle?.status === "active") {
        const { endBattle } = await import("./battle.service.js");
        await endBattle(battle._id, null, "timeout", io);
      }
    } catch (err) {
      console.error("[Timer] Error:", err.message);
    } finally {
      battleTimers.delete(roomId);
    }
  }, 30 * 60 * 1000); // 30 min
  battleTimers.set(roomId, timer);
};

export const clearBattleTimer = (roomId) => {
  if (battleTimers.has(roomId)) {
    clearTimeout(battleTimers.get(roomId));
    battleTimers.delete(roomId);
    console.log(`[Timer] Cleared for room ${roomId}`);
  }
};

class MatchmakingService {
  constructor() {
    this.queue = [];
    this.io = null;
    this.activeSocketMap = new Map();
    this._broadcastTimer = null; // ADD THIS
  }

  setIO(io) {
    this.io = io;
  }

  // ── Public API ──────────────────────────────────────────────────

  async addToQueue(userId, socketId, username, rating) {
    // Remove any stale entry for this user first
    this._removeEntry(userId);

    const entry = { userId, socketId, username, rating, joinedAt: Date.now() };
    this.queue.push(entry);
    this.activeSocketMap.set(userId, socketId);

    console.log(
      `[Queue] + ${username} (${socketId}). Total: ${this.queue.length}`,
    );
    this._broadcastQueueSize();
    await this._tryMatch();
  }

  removeFromQueue(userId, socketId) {
    // Only remove if the CALLING socket is still the active one for this user
    const activeSocketId = this.activeSocketMap.get(userId);
    if (socketId && activeSocketId && activeSocketId !== socketId) {
      console.log(
        `[Queue] Ignore stale disconnect for ${userId} (active: ${activeSocketId}, caller: ${socketId})`,
      );
      return;
    }

    const removed = this._removeEntry(userId);
    if (removed) {
      this.activeSocketMap.delete(userId);
      console.log(`[Queue] - ${userId} removed. Total: ${this.queue.length}`);
      this._broadcastQueueSize();
    }
  }

  updateSocketId(userId, newSocketId) {
    const entry = this.queue.find((p) => p.userId === userId);
    if (entry) {
      entry.socketId = newSocketId;
      this.activeSocketMap.set(userId, newSocketId);
      console.log(
        `[Queue] Updated socket for ${entry.username} → ${newSocketId}`,
      );
    }
  }

  isInQueue(userId) {
    return this.queue.some((p) => p.userId === userId);
  }

  getQueueEntry(userId) {
    return this.queue.find((p) => p.userId === userId) || null;
  }

  getQueuePosition(userId) {
    const idx = this.queue.findIndex((p) => p.userId === userId);
    return idx === -1 ? 0 : idx + 1;
  }

  getQueueSize() {
    return this.queue.length;
  }

  // ── Internal ─────────────────────────────────────────────────────

  _removeEntry(userId) {
    const before = this.queue.length;
    this.queue = this.queue.filter((p) => p.userId !== userId);
    return this.queue.length < before;
  }

  async _tryMatch() {
    while (this.queue.length >= 2) {
      const p1 = this.queue.shift();
      const p2 = this.queue.shift();

      // Verify both sockets are live
      const s1 = this.io.sockets.sockets.get(p1.socketId);
      const s2 = this.io.sockets.sockets.get(p2.socketId);

      if (!s1?.connected) {
        console.log(`[Queue] ${p1.username} socket dead — skipping`);
        this.activeSocketMap.delete(p1.userId);
        // p2 goes back to front
        this.queue.unshift(p2);
        continue;
      }

      if (!s2?.connected) {
        console.log(`[Queue] ${p2.username} socket dead — skipping`);
        this.activeSocketMap.delete(p2.userId);
        // p1 goes back to front
        this.queue.unshift(p1);
        continue;
      }

      await this._createBattle(p1, p2);
    }
    this._broadcastQueueSize();
  }

  async _createBattle(player1, player2) {
    try {
      // Pick random active problem
      const count = await Problem.countDocuments({ isActive: true });
      if (count === 0) {
        console.error("[Queue] No active problems!");
        this.io.to(player1.socketId).emit("matchmaking:error", {
          message: "No problems available. Retry soon.",
        });
        this.io.to(player2.socketId).emit("matchmaking:error", {
          message: "No problems available. Retry soon.",
        });
        // Put both back
        this.queue.unshift(player2);
        this.queue.unshift(player1);
        return;
      }

      const skip = Math.floor(Math.random() * count);
      const problem = await Problem.findOne({ isActive: true }).skip(skip);
      const roomId = uuidv4();
      const now = new Date();

      const battle = await Battle.create({
        roomId,
        problem: problem._id,
        participants: [
          { user: player1.userId, socketId: player1.socketId },
          { user: player2.userId, socketId: player2.socketId },
        ],
        status: "active",
        startedAt: now,
        timeLimit: 1800,
      });

      // Mark both users as in-battle
      await User.updateMany(
        { _id: { $in: [player1.userId, player2.userId] } },
        { currentBattleId: battle._id },
      );

      // Remove from active socket map (they're matched now)
      this.activeSocketMap.delete(player1.userId);
      this.activeSocketMap.delete(player2.userId);

      // Build problem payload (no hidden test cases exposed)
      const problemData = {
        _id: problem._id,
        title: problem.title,
        slug: problem.slug,
        description: problem.description,
        difficulty: problem.difficulty,
        tags: problem.tags,
        constraints: problem.constraints,
        examples: problem.examples,
        sampleTestCases: problem.testCases
          .filter((tc) => tc.isPublic)
          .map((tc) => ({ input: tc.input, output: tc.output })),
        totalTestCases: problem.testCases.length,
      };

      const base = {
        roomId,
        battleId: battle._id.toString(),
        problem: problemData,
        startedAt: now.toISOString(),
        timeLimit: battle.timeLimit,
      };

      // Join sockets to room SERVER-SIDE immediately
      const s1 = this.io.sockets.sockets.get(player1.socketId);
      const s2 = this.io.sockets.sockets.get(player2.socketId);
      if (s1) s1.join(roomId);
      if (s2) s2.join(roomId);

      // Send matched events
      this.io.to(player1.socketId).emit("battle:matched", {
        ...base,
        you: {
          userId: player1.userId,
          username: player1.username,
          rating: player1.rating,
        },
        opponent: {
          userId: player2.userId,
          username: player2.username,
          rating: player2.rating,
        },
      });
      this.io.to(player2.socketId).emit("battle:matched", {
        ...base,
        you: {
          userId: player2.userId,
          username: player2.username,
          rating: player2.rating,
        },
        opponent: {
          userId: player1.userId,
          username: player1.username,
          rating: player1.rating,
        },
      });

      // Start 30-min timer
      startBattleTimer(this.io, roomId, battle._id.toString());

      // Signal both clients to start their countdown
      this.io
        .to(roomId)
        .emit("battle:start", { roomId, battleId: battle._id.toString() });

      console.log(
        `⚔️  [${roomId}] ${player1.username} vs ${player2.username} | "${problem.title}"`,
      );
    } catch (err) {
      console.error("[Matchmaking] createBattle error:", err.message);
      // Requeue both
      this.queue.unshift(player2);
      this.queue.unshift(player1);
    }
  }

  _broadcastQueueSize() {
    if (!this.io) return;
    // Debounce — wait 100ms so rapid add/remove settles
    if (this._broadcastTimer) clearTimeout(this._broadcastTimer);
    this._broadcastTimer = setTimeout(() => {
      this._broadcastTimer = null;
      this.io.emit("matchmaking:queue_size", this.queue.length);
    }, 100);
  }
}

export default new MatchmakingService();
