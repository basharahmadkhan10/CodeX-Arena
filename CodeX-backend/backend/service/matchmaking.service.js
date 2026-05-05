import { v4 as uuidv4 } from "uuid";
import Battle from "../models/Battle.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";

const battleTimers = new Map();

const MODE_STANDARD = "standard";
const MODE_DEBUGGING = "debugging";

const normalizeMode = (mode) => (mode === MODE_DEBUGGING ? MODE_DEBUGGING : MODE_STANDARD);

const problemQueryForMode = (mode) =>
  normalizeMode(mode) === MODE_DEBUGGING
    ? { mode: MODE_DEBUGGING, isActive: true }
    : {
        isActive: true,
        $or: [{ mode: { $exists: false } }, { mode: MODE_STANDARD }],
      };

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
  }, 30 * 60 * 1000);
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
    this.queues = new Map([
      [MODE_STANDARD, []],
      [MODE_DEBUGGING, []],
    ]);
    this.io = null;
    this.activeSocketMap = new Map();
    this._broadcastTimer = null;
  }

  setIO(io) {
    this.io = io;
  }

  _getQueue(mode = MODE_STANDARD) {
    const normalizedMode = normalizeMode(mode);
    if (!this.queues.has(normalizedMode)) {
      this.queues.set(normalizedMode, []);
    }
    return this.queues.get(normalizedMode);
  }

  _getAllEntries() {
    return [...this.queues.values()].flat();
  }

  async addToQueue(userId, socketId, username, rating, mode = MODE_STANDARD) {
    const normalizedMode = normalizeMode(mode);
    this._removeEntry(userId);

    const entry = { userId, socketId, username, rating, mode: normalizedMode, joinedAt: Date.now() };
    this._getQueue(normalizedMode).push(entry);
    this.activeSocketMap.set(userId, socketId);

    console.log(`[Queue:${normalizedMode}] + ${username} (${socketId}). Total: ${this.getQueueSize(normalizedMode)}`);

    const socket = this.io.sockets.sockets.get(socketId);
    if (socket && socket.connected) {
      socket.emit("matchmaking:queued", {
        position: this.getQueuePosition(userId, normalizedMode),
        queueSize: this.getQueueSize(normalizedMode),
        message: "In queue — finding opponent...",
      });
    }

    this._broadcastQueueSize(normalizedMode);
    await this._tryMatch(normalizedMode);
  }

  removeFromQueue(userId, socketId) {
    const activeSocketId = this.activeSocketMap.get(userId);
    if (socketId && activeSocketId && activeSocketId !== socketId) {
      console.log(
        `[Queue] Ignore stale disconnect for ${userId} (active: ${activeSocketId}, caller: ${socketId})`
      );
      return;
    }

    const removed = this._removeEntry(userId);
    if (removed) {
      this.activeSocketMap.delete(userId);
      console.log(`[Queue] - ${userId} removed.`);
      this._broadcastQueueSize();
    }
  }

  updateSocketId(userId, newSocketId) {
    const entry = this._getAllEntries().find((p) => p.userId === userId);
    if (entry) {
      entry.socketId = newSocketId;
      this.activeSocketMap.set(userId, newSocketId);
      console.log(`[Queue] Updated socket for ${entry.username} → ${newSocketId}`);
    }
  }

  isInQueue(userId, mode) {
    if (mode) return this._getQueue(mode).some((p) => p.userId === userId);
    return this._getAllEntries().some((p) => p.userId === userId);
  }

  getQueueEntry(userId, mode) {
    if (mode) return this._getQueue(mode).find((p) => p.userId === userId) || null;
    return this._getAllEntries().find((p) => p.userId === userId) || null;
  }

  getQueuePosition(userId, mode = MODE_STANDARD) {
    const queue = this._getQueue(mode);
    const idx = queue.findIndex((p) => p.userId === userId);
    return idx === -1 ? 0 : idx + 1;
  }

  getQueueSize(mode) {
    if (mode) return this._getQueue(mode).length;
    return [...this.queues.values()].reduce((total, queue) => total + queue.length, 0);
  }

  _removeEntry(userId) {
    let removed = false;
    for (const [mode, queue] of this.queues.entries()) {
      const nextQueue = queue.filter((p) => p.userId !== userId);
      if (nextQueue.length !== queue.length) {
        removed = true;
        this.queues.set(mode, nextQueue);
      }
    }
    return removed;
  }

  async _tryMatch(mode = MODE_STANDARD) {
    const queue = this._getQueue(mode);

    while (queue.length >= 2) {
      const p1 = queue.shift();
      const p2 = queue.shift();

      const s1 = this.io.sockets.sockets.get(p1.socketId);
      const s2 = this.io.sockets.sockets.get(p2.socketId);

      if (!s1?.connected) {
        console.log(`[Queue:${mode}] ${p1.username} socket dead — skipping`);
        this.activeSocketMap.delete(p1.userId);
        queue.unshift(p2);
        continue;
      }

      if (!s2?.connected) {
        console.log(`[Queue:${mode}] ${p2.username} socket dead — skipping`);
        this.activeSocketMap.delete(p2.userId);
        queue.unshift(p1);
        continue;
      }

      await this._createBattle(p1, p2, mode);
    }

    this._broadcastQueueSize(mode);
  }

  async _createBattle(player1, player2, mode = MODE_STANDARD) {
    try {
      const query = problemQueryForMode(mode);
      const count = await Problem.countDocuments(query);

      if (count === 0) {
        console.error(`[Queue:${mode}] No active problems!`);
        this.io.to(player1.socketId).emit("matchmaking:error", {
          message: "No problems available. Retry soon.",
        });
        this.io.to(player2.socketId).emit("matchmaking:error", {
          message: "No problems available. Retry soon.",
        });

        this._getQueue(mode).unshift(player2);
        this._getQueue(mode).unshift(player1);
        return;
      }

      const skip = Math.floor(Math.random() * count);
      const problem = await Problem.findOne(query).skip(skip).lean();
      const roomId = uuidv4();
      const now = new Date();

      const battle = await Battle.create({
        roomId,
        mode: normalizeMode(mode),
        problem: problem._id,
        participants: [
          { user: player1.userId, socketId: player1.socketId },
          { user: player2.userId, socketId: player2.socketId },
        ],
        status: "active",
        startedAt: now,
        timeLimit: 1800,
      });

      await User.updateMany(
        { _id: { $in: [player1.userId, player2.userId] } },
        { currentBattleId: battle._id }
      );

      this.activeSocketMap.delete(player1.userId);
      this.activeSocketMap.delete(player2.userId);

      const problemData = {
        _id: problem._id,
        title: problem.title || "",
        slug: problem.slug || "",
        description: problem.description || "",
        difficulty: problem.difficulty || "Medium",
        tags: problem.tags || [],
        constraints: problem.constraints || "",
        examples: problem.examples || [],
        sampleTestCases: (problem.testCases || [])
          .filter((tc) => tc.isPublic)
          .map((tc) => ({ input: tc.input || "", output: tc.output || "" })),
        totalTestCases: problem.testCases?.length || 0,
        mode: problem.mode || normalizeMode(mode),
        starterCode: problem.starterCode || null,
      };

      const base = {
        roomId,
        battleId: battle._id.toString(),
        problem: problemData,
        startedAt: now.toISOString(),
        timeLimit: battle.timeLimit,
        mode: normalizeMode(mode),
      };

      const s1Socket = this.io.sockets.sockets.get(player1.socketId);
      const s2Socket = this.io.sockets.sockets.get(player2.socketId);
      if (s1Socket) s1Socket.join(roomId);
      if (s2Socket) s2Socket.join(roomId);

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

      this.io.to(player1.socketId).emit("battle:started", {
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
      this.io.to(player2.socketId).emit("battle:started", {
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

      startBattleTimer(this.io, roomId, battle._id.toString());

      this.io.to(roomId).emit("battle:start", {
        roomId,
        battleId: battle._id.toString(),
      });
      this.io.to(roomId).emit("battle:started", {
        roomId,
        battleId: battle._id.toString(),
      });

      console.log(
        `⚔️ [${roomId}] ${player1.username} vs ${player2.username} | "${problem.title}" [${normalizeMode(mode)}]`
      );
    } catch (err) {
      console.error("[Matchmaking] createBattle error:", err.message);
      this._getQueue(mode).unshift(player2);
      this._getQueue(mode).unshift(player1);
    }
  }

  _broadcastUserPositions(mode) {
    if (!this.io) return;

    if (mode) {
      const queue = this._getQueue(mode);
      console.log(`📢 Broadcasting positions to ${queue.length} users in ${mode} queue`);
      for (let i = 0; i < queue.length; i++) {
        const player = queue[i];
        const socket = this.io.sockets.sockets.get(player.socketId);
        if (socket && socket.connected) {
          socket.emit("matchmaking:queued", {
            position: i + 1,
            queueSize: queue.length,
            message: `Position ${i + 1} of ${queue.length}`,
          });
        }
      }
      this.io.emit("matchmaking:queue_size", queue.length);
      return;
    }

    const allEntries = this._getAllEntries();
    console.log(`📢 Broadcasting positions to ${allEntries.length} users in queue`);

    for (const queue of this.queues.values()) {
      for (let i = 0; i < queue.length; i++) {
        const player = queue[i];
        const socket = this.io.sockets.sockets.get(player.socketId);
        if (socket && socket.connected) {
          socket.emit("matchmaking:queued", {
            position: i + 1,
            queueSize: queue.length,
            message: `Position ${i + 1} of ${queue.length}`,
          });
        }
      }
    }

    this.io.emit("matchmaking:queue_size", allEntries.length);
  }

  _broadcastQueueSize(mode) {
    if (!this.io) return;
    if (this._broadcastTimer) clearTimeout(this._broadcastTimer);
    this._broadcastTimer = setTimeout(() => {
      this._broadcastTimer = null;
      this._broadcastUserPositions(mode);
    }, 100);
  }
}

export default new MatchmakingService();