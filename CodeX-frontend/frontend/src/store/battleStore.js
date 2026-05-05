import { create } from "zustand";
import { getSocket } from "../services/socket";
import useAuthStore from "./authStore";

const useBattleStore = create((set, get) => ({
  // ── Matchmaking ──────────────────────────────────────────────────
  queueStatus: "idle", // idle | searching | matched
  queueMode: "classic",
  queueSize: 0,
  queuePosition: 0,

  // ── 1v1 Battle data ──────────────────────────────────────────────
  battle: null,
  timeLeft: 0,
  timerInterval: null,

  // ── 1v1 Submission state ─────────────────────────────────────────
  isSubmitting: false,
  submissionResult: null,
  runResult: null,
  opponentStatus: null,
  opponentSubmitting: false,

  // ── 1v1 Battle result ────────────────────────────────────────────
  battleResult: null,
  opponentDisconnected: false,

  // ── Room Battle state ────────────────────────────────────────────
  roomCode: null,
  roomMembers: [],
  roomStatus: "idle",
  roomError: null,
  isRoomHost: false,
  roomBattle: null,

  // Socket listener flag to prevent duplicates
  _listenersInitialized: false,

  // ── Socket listener init ─────────────────────────────────────────
  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    if (get()._listenersInitialized) return;

    // Clean slate — remove any stale listeners
    const events = [
      "matchmaking:queued",
      "matchmaking:queue_update",
      "matchmaking:queue_size",
      "matchmaking:matched",
      "matchmaking:error",
      "battle:matched",
      "battle:started",
      "battle:start",
      "battle:submission_result",
      "battle:submission_pending",
      "battle:opponent_submitting",
      "battle:opponent_submission",
      "battle:submission_update",
      "battle:ended",
      "battle:run_result",
      "battle:opponent_disconnected",
      "battle:opponent_reconnected",
      "battle:error",
      "battle:rejoined",
      "room:created",
      "room:joined",
      "room:updated",
      "room:error",
      "room:left",
      "room:battle_started",
    ];
    events.forEach((e) => socket.off(e));

    // ── Matchmaking ────────────────────────────────────────────────

    socket.on("matchmaking:queued", ({ position, queueSize } = {}) => {
      set({
        queueStatus: "searching",
        queuePosition: position || 0,
        queueSize: queueSize || 0,
      });
    });

    socket.on("matchmaking:queue_update", ({ size, position } = {}) => {
      set({ queueSize: size || 0, queuePosition: position || 0 });
    });

    socket.on("matchmaking:queue_size", (size) => {
      set({ queueSize: typeof size === "number" ? size : 0 });
    });

    socket.on("matchmaking:matched", () => {
      set({ queueStatus: "matched" });
    });

    socket.on("matchmaking:error", ({ message } = {}) => {
      set({ queueStatus: "idle" });
      console.error("[Matchmaking] Error:", message);
    });

    // ── Battle matched (primary event from matchmaking service) ────
    // This fires first — store the full battle payload
    socket.on("battle:matched", (data) => {
      console.log("⚔️ battle:matched", data.roomId);
      const myId = useAuthStore.getState().user?._id?.toString();

      // data already has you / opponent from matchmaking service
      // but also guard with participants if present
      const you = data.you || _extractParticipant(data, myId, true);
      const opponent = data.opponent || _extractParticipant(data, myId, false);

      const timeLimit = _validTimeLimit(data.timeLimit);
      get().stopTimer();

      set({
        queueStatus: "matched",
        battle: {
          ...data,
          you,
          opponent,
          timeLimit,
        },
        battleResult: null,
        submissionResult: null,
        runResult: null,
        opponentStatus: null,
        opponentSubmitting: false,
        opponentDisconnected: false,
        isSubmitting: false,
        timeLeft: timeLimit,
      });

      get().startTimer(timeLimit);
    });

    // ── Battle started (sometimes fired after matched) ─────────────
    socket.on("battle:started", (data) => {
      // Only re-process if we don't already have a full battle object
      // (avoids overwriting the richer battle:matched payload)
      const existing = get().battle;
      if (existing?.problem && data.roomId === existing?.roomId) return;

      console.log("🟢 battle:started", data.roomId);
      const myId = useAuthStore.getState().user?._id?.toString();

      const you = data.you || _extractParticipant(data, myId, true);
      const opponent = data.opponent || _extractParticipant(data, myId, false);
      const timeLimit = _validTimeLimit(data.timeLimit);

      get().stopTimer();

      set({
        battle: { ...data, you, opponent, timeLimit },
        queueStatus: "matched",
        battleResult: null,
        submissionResult: null,
        runResult: null,
        opponentStatus: null,
        opponentSubmitting: false,
        opponentDisconnected: false,
        isSubmitting: false,
        timeLeft: timeLimit,
      });

      get().startTimer(timeLimit);
    });

    // ── battle:start (room-level broadcast — just a signal) ────────
    socket.on("battle:start", () => {
      // No-op: actual data arrives via battle:matched / battle:started
    });

    // ── Submissions ────────────────────────────────────────────────

    socket.on("battle:submission_pending", () => {
      set({ isSubmitting: true });
    });

    socket.on("battle:submission_result", (result) => {
      set({ isSubmitting: false, submissionResult: result });
    });

    socket.on("battle:opponent_submitting", () => {
      set({ opponentSubmitting: true });
      // Auto-clear if server forgets to send update
      setTimeout(() => set({ opponentSubmitting: false }), 5000);
    });

    // Legacy event name
    socket.on("battle:opponent_submission", (data) => {
      set({ opponentSubmitting: false, opponentStatus: data });
    });

    // New event name used in matchmaking service
    socket.on("battle:submission_update", (data) => {
      const myId =
        get().battle?.you?.userId ||
        get().battle?.you?._id ||
        useAuthStore.getState().user?._id?.toString();

      if (data.userId?.toString() !== myId?.toString()) {
        set({
          opponentStatus: {
            status: data.status,
            passed: data.passed,
            total: data.total,
          },
          opponentSubmitting: false,
        });
      }
    });

    // ── Run result ─────────────────────────────────────────────────

    socket.on("battle:run_result", (result) => {
      set({ runResult: result });
    });

    // ── Battle ended ───────────────────────────────────────────────

    socket.on("battle:ended", (data) => {
      get().stopTimer();

      const battle = get().battle;
      const myId = (
        battle?.you?.userId ||
        battle?.you?._id ||
        useAuthStore.getState().user?._id
      )?.toString();

      const enrichedParticipants = (data.participants || []).map((p) => ({
        ...p,
        isMe: p.userId?.toString() === myId,
      }));

      const isDraw = !data.winnerId;
      const iWon = !isDraw && data.winnerId?.toString() === myId;

      set({
        battleResult: { ...data, participants: enrichedParticipants, iWon, isDraw },
        isSubmitting: false,
        opponentSubmitting: false,
        queueStatus: "idle",
      });

      const authStore = useAuthStore.getState();
      if (authStore.applyBattleResult) {
        authStore.applyBattleResult(data, myId);
      }
    });

    // ── Disconnect / reconnect ─────────────────────────────────────

    socket.on("battle:opponent_disconnected", () => {
      set({ opponentDisconnected: true });
    });

    socket.on("battle:opponent_reconnected", () => {
      set({ opponentDisconnected: false });
    });

    socket.on("battle:error", ({ message } = {}) => {
      set({ isSubmitting: false });
      console.error("[Battle] Error:", message);
    });

    socket.on("battle:rejoined", ({ roomId }) => {
      console.log("✅ Rejoined battle room:", roomId);
    });

    // ── Room events ────────────────────────────────────────────────

    socket.on("room:created", ({ code, members, isHost }) => {
      set({
        roomCode: code,
        roomMembers: members || [],
        roomStatus: "waiting",
        isRoomHost: isHost ?? true,
        roomError: null,
      });
    });

    socket.on("room:joined", ({ code, members, isHost }) => {
      set({
        roomCode: code,
        roomMembers: members || [],
        roomStatus: "waiting",
        isRoomHost: isHost ?? false,
        roomError: null,
      });
    });

    socket.on("room:updated", ({ members }) => {
      set({ roomMembers: members || [] });
    });

    socket.on("room:error", ({ message }) => {
      set({ roomError: message, roomStatus: "idle" });
    });

    socket.on("room:left", () => {
      set({
        roomCode: null,
        roomMembers: [],
        roomStatus: "idle",
        isRoomHost: false,
        roomBattle: null,
        roomError: null,
      });
    });

    socket.on("room:battle_started", (data) => {
      set({ roomBattle: data, roomStatus: "in_battle" });
    });

    set({ _listenersInitialized: true });
  },

  // ── Fetch active battle (rehydrate on page refresh) ──────────────
  fetchActiveBattle: async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/battles/active", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!data.success || !data.battle) return;

      const battle = data.battle;
      const myId = useAuthStore.getState().user?._id?.toString();

      const youParticipant = battle.participants.find(
        (p) => p.user._id?.toString() === myId
      );
      const oppParticipant = battle.participants.find(
        (p) => p.user._id?.toString() !== myId
      );

      const problem = _reshapeProblem(battle.problem, battle.mode);

      const timeLimit = _validTimeLimit(battle.timeLimit);
      const elapsed = Math.floor((Date.now() - new Date(battle.startedAt)) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);

      get().stopTimer();

      set({
        queueStatus: "matched",
        battle: {
          roomId: battle.roomId,
          battleId: battle._id.toString(),
          problem,
          startedAt: battle.startedAt,
          timeLimit,
          mode: battle.mode,
          you: {
            userId: youParticipant?.user._id?.toString(),
            username: youParticipant?.user.username,
            rating: youParticipant?.user.rating,
          },
          opponent: {
            userId: oppParticipant?.user._id?.toString(),
            username: oppParticipant?.user.username,
            rating: oppParticipant?.user.rating,
          },
        },
        submissionResult: youParticipant?.result?.status
          ? youParticipant.result
          : null,
        timeLeft: remaining,
      });

      get().startTimer(remaining);
    } catch (err) {
      console.error("[Store] fetchActiveBattle failed:", err);
    }
  },

  // ── Matchmaking actions ──────────────────────────────────────────

  joinQueue: (mode = "classic") => {
    const socket = getSocket();
    if (!socket) return;
    get().reset();
    set({ queueStatus: "searching", queueMode: mode });
    socket.emit("matchmaking:join", { mode });
  },

  leaveQueue: () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("matchmaking:leave");
    set({ queueStatus: "idle", queueMode: "classic", queueSize: 0, queuePosition: 0 });
  },

  // ── 1v1 Battle actions ───────────────────────────────────────────

  submitCode: (battleId, code, language) => {
    const socket = getSocket();
    if (!socket) return;
    set({ isSubmitting: true, submissionResult: null });
    socket.emit("battle:submit", { battleId, code, language });
  },

  runCode: (code, language, input) => {
    const socket = getSocket();
    if (!socket) return;
    set({ runResult: null });
    socket.emit("battle:run_code", { code, language, input });
  },

  forfeit: (battleId) => {
    const socket = getSocket();
    if (!socket) return;
    get().stopTimer();
    socket.emit("battle:forfeit", { battleId });
  },

  // ── Room actions ─────────────────────────────────────────────────

  createRoom: () => {
    const socket = getSocket();
    if (!socket) return;
    set({ roomStatus: "creating", roomError: null });
    socket.emit("room:create");
  },

  joinRoom: (code) => {
    const socket = getSocket();
    if (!socket) return;
    set({ roomError: null });
    socket.emit("room:join", { code: code.toUpperCase() });
  },

  startRoom: (code) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("room:start", { code });
  },

  leaveRoom: (code) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("room:leave", { code });
    set({
      roomCode: null,
      roomMembers: [],
      roomStatus: "idle",
      isRoomHost: false,
      roomBattle: null,
      roomError: null,
    });
  },

  resetRoom: () => {
    set({
      roomCode: null,
      roomMembers: [],
      roomStatus: "idle",
      isRoomHost: false,
      roomBattle: null,
      roomError: null,
    });
  },

  // ── Timer ────────────────────────────────────────────────────────

  startTimer: (timeLimit) => {
    const existing = get().timerInterval;
    if (existing) clearInterval(existing);

    const validLimit = _validTimeLimit(timeLimit);
    const startTime = Date.now();
    set({ timeLeft: validLimit });

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = Math.max(0, validLimit - elapsed);
      set({ timeLeft: left });

      if (left === 0) {
        clearInterval(interval);
        set({ timerInterval: null });
        // Server handles timeout — no need to forfeit from client
        // (avoids double-forfeit race condition)
      }
    }, 1000);

    set({ timerInterval: interval });
  },

  stopTimer: () => {
    const interval = get().timerInterval;
    if (interval) {
      clearInterval(interval);
      set({ timerInterval: null });
    }
  },

  // ── Reset 1v1 ────────────────────────────────────────────────────

  reset: () => {
    get().stopTimer();
    set({
      queueStatus: "idle",
      queueMode: "classic",
      queueSize: 0,
      queuePosition: 0,
      battle: null,
      timeLeft: 0,
      isSubmitting: false,
      submissionResult: null,
      runResult: null,
      opponentStatus: null,
      opponentSubmitting: false,
      battleResult: null,
      opponentDisconnected: false,
      _listenersInitialized: false, // allow re-init on next mount
    });
  },
}));

// ── Private helpers ────────────────────────────────────────────────────────

function _validTimeLimit(value) {
  const n = parseInt(value);
  if (isNaN(n) || n <= 0) {
    console.warn(`[Timer] Invalid timeLimit "${value}", defaulting to 1800s`);
    return 1800;
  }
  return n;
}

function _extractParticipant(data, myId, wantMe) {
  if (!data.participants?.length) return null;
  return (
    data.participants.find((p) => {
      const pid = (p.user?._id || p.user || p.userId)?.toString();
      return wantMe ? pid === myId : pid !== myId;
    }) || null
  );
}

function _reshapeProblem(problem, battleMode) {
  if (!problem) return null;
  return {
    _id: problem._id,
    title: problem.title,
    slug: problem.slug,
    description: problem.description,
    difficulty: problem.difficulty,
    tags: problem.tags || [],
    constraints: problem.constraints,
    examples: problem.examples || [],
    starterCode: problem.starterCode || null,
    mode: problem.mode || battleMode || "standard",
    sampleTestCases: (problem.testCases || [])
      .filter((tc) => tc.isPublic)
      .map((tc) => ({ input: tc.input, output: tc.output })),
    totalTestCases: problem.testCases?.length || 0,
  };
}

export default useBattleStore;
