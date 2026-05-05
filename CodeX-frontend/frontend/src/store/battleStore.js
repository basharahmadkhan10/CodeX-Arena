import { create } from "zustand";
import { getSocket } from "../services/socket";
import useAuthStore from "./authStore";

const useBattleStore = create((set, get) => ({
  // ── Matchmaking ──────────────────────────────────────────────────
  queueStatus:    "idle",   // idle | searching | matched
  queueMode:      "classic",
  queueSize:      0,
  queuePosition:  0,

  // ── 1v1 Battle data ──────────────────────────────────────────────
  battle:        null,
  timeLeft:      0,
  timerInterval: null,

  // ── 1v1 Submission state ─────────────────────────────────────────
  isSubmitting:       false,
  submissionResult:   null,
  runResult:          null,
  opponentStatus:     null,
  opponentSubmitting: false,

  // ── 1v1 Battle result ────────────────────────────────────────────
  battleResult:         null,
  opponentDisconnected: false,

  // ── Room Battle state ────────────────────────────────────────────
  roomCode:    null,
  roomMembers: [],
  roomStatus:  "idle",
  roomError:   null,
  isRoomHost:  false,
  roomBattle:  null,

  // internal — forfeit safety fallback timer id
  _forfeitFallback: null,

  // ── Socket listener init ─────────────────────────────────────────
  initSocketListeners: () => {},

  // ── Fetch active battle (rehydrate after page refresh) ───────────
  fetchActiveBattle: async () => {
    try {
      const token = useAuthStore.getState().token;
      const res   = await fetch("/api/battles/active", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.battle) return;

      const battle = data.battle;
      const myId   = useAuthStore.getState().user?._id?.toString();

      const youParticipant = battle.participants.find(
        (p) => p.user._id?.toString() === myId
      );
      const oppParticipant = battle.participants.find(
        (p) => p.user._id?.toString() !== myId
      );

      if (!battle.problem || typeof battle.problem !== "object") {
        console.warn("[Store] fetchActiveBattle: problem not populated, skipping");
        return;
      }

      const problem   = _reshapeProblem(battle.problem, battle.mode);
      const timeLimit = _validTimeLimit(battle.timeLimit);
      const elapsed   = Math.floor((Date.now() - new Date(battle.startedAt)) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);

      get().stopTimer();

      set({
        queueStatus: "matched",
        battle: {
          roomId:    battle.roomId,
          battleId:  battle._id.toString(),
          problem,
          startedAt: battle.startedAt,
          timeLimit,
          mode:      battle.mode,
          you: {
            userId:   youParticipant?.user._id?.toString(),
            username: youParticipant?.user.username,
            rating:   youParticipant?.user.rating,
          },
          opponent: {
            userId:   oppParticipant?.user._id?.toString(),
            username: oppParticipant?.user.username,
            rating:   oppParticipant?.user.rating,
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

  // ── Matchmaking ──────────────────────────────────────────────────
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

  // FIX: Don't stop timer here. Wait for server to confirm via battle:ended.
  // If server rejects forfeit the timer must keep running — otherwise UI
  // freezes with no result modal ever arriving.
  forfeit: (battleId) => {
    const socket = getSocket();
    if (!socket || !battleId) return;

    set({ isSubmitting: true });
    socket.emit("battle:forfeit", { battleId });

    // Safety net: if battle:ended never arrives in 10s, unblock the UI
    const fallback = setTimeout(() => {
      const state = useBattleStore.getState();
      if (!state.battleResult) {
        console.warn("[forfeit] battle:ended not received in 10s — unblocking UI");
        get().stopTimer();
        set({ isSubmitting: false, _forfeitFallback: null });
      }
    }, 10_000);

    set({ _forfeitFallback: fallback });
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
      roomCode:    null,
      roomMembers: [],
      roomStatus:  "idle",
      isRoomHost:  false,
      roomBattle:  null,
      roomError:   null,
    });
  },

  resetRoom: () => {
    set({
      roomCode:    null,
      roomMembers: [],
      roomStatus:  "idle",
      isRoomHost:  false,
      roomBattle:  null,
      roomError:   null,
    });
  },

  // ── Timer ────────────────────────────────────────────────────────
  startTimer: (timeLimit) => {
    const existing = get().timerInterval;
    if (existing) clearInterval(existing);

    const validLimit = _validTimeLimit(timeLimit);
    const startTime  = Date.now();
    set({ timeLeft: validLimit });

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left    = Math.max(0, validLimit - elapsed);
      set({ timeLeft: left });
      if (left === 0) {
        clearInterval(interval);
        set({ timerInterval: null });
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

  // ── Full reset ───────────────────────────────────────────────────
  reset: () => {
    get().stopTimer();
    const fallback = get()._forfeitFallback;
    if (fallback) clearTimeout(fallback);

    set({
      queueStatus:          "idle",
      queueMode:            "classic",
      queueSize:            0,
      queuePosition:        0,
      battle:               null,
      timeLeft:             0,
      isSubmitting:         false,
      submissionResult:     null,
      runResult:            null,
      opponentStatus:       null,
      opponentSubmitting:   false,
      battleResult:         null,
      opponentDisconnected: false,
      _forfeitFallback:     null,
    });
  },
}));

// ── Private helpers ───────────────────────────────────────────────────────────

function _validTimeLimit(value) {
  const n = parseInt(value);
  if (isNaN(n) || n <= 0) {
    console.warn(`[Timer] Invalid timeLimit "${value}", defaulting to 1800s`);
    return 1800;
  }
  return n;
}

function _reshapeProblem(problem, battleMode) {
  if (!problem) return null;
  return {
    _id:         problem._id,
    title:       problem.title,
    slug:        problem.slug,
    description: problem.description,
    difficulty:  problem.difficulty,
    tags:        problem.tags || [],
    constraints: problem.constraints,
    examples:    problem.examples || [],
    starterCode: problem.starterCode || null,
    mode:        problem.mode || battleMode || "standard",
    sampleTestCases: (problem.testCases || [])
      .filter((tc) => tc.isPublic)
      .map((tc) => ({ input: tc.input, output: tc.output })),
    totalTestCases: problem.testCases?.length || 0,
  };
}

export default useBattleStore;
