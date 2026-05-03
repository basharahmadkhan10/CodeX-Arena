import { create } from "zustand";
import { getSocket } from "../services/socket";

const useBattleStore = create((set, get) => ({
  // ── Matchmaking ──────────────────────────────────────────────────
  queueStatus: "idle", // idle | searching | matched
  queueSize: 0,
  queuePosition: 0,

  // ── 1v1 Battle data ──────────────────────────────────────────────
  battle: null, // { roomId, battleId, problem, you, opponent, startedAt, timeLimit }
  timeLeft: 0,
  timerInterval: null,

  // ── 1v1 Submission state ─────────────────────────────────────────
  isSubmitting: false,
  submissionResult: null, // { status, passed, total, results }
  runResult: null, // { output, cpuTime }
  opponentStatus: null, // { status, passed, total }
  opponentSubmitting: false,

  // ── 1v1 Battle result ────────────────────────────────────────────
  battleResult: null, // { winnerId, reason, duration, participants }
  opponentDisconnected: false,

  // ── Room Battle state ────────────────────────────────────────────
  roomCode: null,
  roomMembers: [], // [{ userId, username, isHost }]
  roomStatus: "idle", // idle | creating | waiting | in_battle
  isRoomHost: false,
  roomBattle: null, // { battleId, roomId, problem, participants, timeLimit, startedAt }
  roomError: null,

  // ── Matchmaking actions ──────────────────────────────────────────
  joinQueue: () => {
    const socket = getSocket();
    if (!socket) return;
    set({
      queueStatus: "searching",
      submissionResult: null,
      battleResult: null,
      opponentDisconnected: false,
    });
    socket.emit("matchmaking:join");
  },

  leaveQueue: () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("matchmaking:leave");
    set({ queueStatus: "idle", queueSize: 0 });
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

  // ── Timer (shared by 1v1 and room) ───────────────────────────────
  startTimer: (timeLimit) => {
    const existing = get().timerInterval;
    if (existing) clearInterval(existing);

    const startTime = Date.now();
    set({ timeLeft: timeLimit });

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = Math.max(0, timeLimit - elapsed);
      set({ timeLeft: left });
      if (left === 0) clearInterval(interval);
    }, 1000);

    set({ timerInterval: interval });
  },

  stopTimer: () => {
    const interval = get().timerInterval;
    if (interval) clearInterval(interval);
    set({ timerInterval: null });
  },

  // ── Reset 1v1 ────────────────────────────────────────────────────
  reset: () => {
    get().stopTimer();
    set({
      queueStatus: "idle",
      battle: null,
      timeLeft: 0,
      isSubmitting: false,
      submissionResult: null,
      runResult: null,
      opponentStatus: null,
      opponentSubmitting: false,
      battleResult: null,
      opponentDisconnected: false,
    });
  },
}));

export default useBattleStore;
