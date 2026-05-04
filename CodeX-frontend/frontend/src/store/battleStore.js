import { create } from "zustand";
import { getSocket } from "../services/socket";

const useBattleStore = create((set, get) => ({
  // ── Matchmaking ──────────────────────────────────────────────────
  queueStatus: "idle", // idle | searching | matched
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
  isRoomHost: false,
  roomBattle: null,
  roomError: null,

  // ── Socket listener init (call once after login / socket connect) ─
  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    // Avoid double-attaching
    socket.off("matchmaking:queued");
    socket.off("matchmaking:queue_update");
    socket.off("matchmaking:matched");
    socket.off("battle:started");
    socket.off("battle:submission_result");
    socket.off("battle:submission_pending");
    socket.off("battle:opponent_submitting");
    socket.off("battle:opponent_submission");
    socket.off("battle:ended");
    socket.off("battle:run_result");
    socket.off("battle:opponent_disconnected");
    socket.off("battle:opponent_reconnected");
    socket.off("room:created");
    socket.off("room:joined");
    socket.off("room:updated");
    socket.off("room:error");
    socket.off("room:left");
    socket.off("room:battle_started");

    // ── Matchmaking ─────────────────────────────────────────────────
    socket.on("matchmaking:queued", () => {
      set({ queueStatus: "searching" });
    });

    socket.on("matchmaking:queue_update", ({ size, position }) => {
      set({ queueSize: size, queuePosition: position });
    });

    socket.on("matchmaking:matched", (data) => {
      set({ queueStatus: "matched" });
    });

    // ── Battle started ───────────────────────────────────────────────
    socket.on("battle:started", (data) => {
      // data: { roomId, battleId, problem, you, opponent, timeLimit, startedAt }
      set({
        battle: data,
        queueStatus: "matched",
        battleResult: null,
        submissionResult: null,
        runResult: null,
        opponentStatus: null,
        opponentSubmitting: false,
        opponentDisconnected: false,
        isSubmitting: false,
      });
      get().startTimer(data.timeLimit);
    });

    // ── Submission results ───────────────────────────────────────────
    socket.on("battle:submission_pending", () => {
      set({ isSubmitting: true });
    });

    socket.on("battle:submission_result", (result) => {
      // result: { status, passed, total, results, errorMessage }
      set({ isSubmitting: false, submissionResult: result });
    });

    // Opponent submitted
    socket.on("battle:opponent_submitting", () => {
      set({ opponentSubmitting: true });
    });

    socket.on("battle:opponent_submission", (data) => {
      // data: { status, passed, total }
      set({ opponentSubmitting: false, opponentStatus: data });
    });

    // ── Run result ───────────────────────────────────────────────────
    socket.on("battle:run_result", (result) => {
      set({ runResult: result });
    });

    // ── Battle ended ─────────────────────────────────────────────────
    socket.on("battle:ended", (data) => {
      // data: { winnerId, reason, duration, participants: [{ userId, username, ratingChange, ... }] }
      get().stopTimer();

      const battle = get().battle;
      const myUserId = battle?.you?.userId;

      // Compute iWon / isDraw on participants
      const enrichedParticipants = (data.participants || []).map((p) => ({
        ...p,
        isMe: p.userId === myUserId,
      }));

      let iWon = false;
      let isDraw = false;

      if (!data.winnerId) {
        isDraw = true;
      } else {
        iWon = data.winnerId === myUserId;
      }

      set({
        battleResult: {
          ...data,
          participants: enrichedParticipants,
          iWon,
          isDraw,
        },
        isSubmitting: false,
      });
    });

    // ── Disconnect / reconnect ───────────────────────────────────────
    socket.on("battle:opponent_disconnected", () => {
      set({ opponentDisconnected: true });
    });

    socket.on("battle:opponent_reconnected", () => {
      set({ opponentDisconnected: false });
    });

    // ── Room events ──────────────────────────────────────────────────
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
  },

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

  // ── Timer ────────────────────────────────────────────────────────
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
