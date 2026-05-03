/** @format */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import {
  Play,
  Send,
  Flag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  WifiOff,
  Users,
  Crown,
  ShieldAlert,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import useBattleStore from "../store/battleStore";
import useAuthStore from "../store/authStore";
import { getSocket } from "../services/socket";

// ── Constants ────────────────────────────────────────────────────────────────
const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
];

const STARTER_CODE = {
  javascript: `const lines = [];\nprocess.stdin.on('data', d => lines.push(...d.toString().split('\\n')));\nprocess.stdin.on('end', () => {\n  // Your solution here\n});`,
  python: `import sys\ndata = sys.stdin.read().split()\n# Your solution here`,
  java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your solution here\n    }\n}`,
  cpp: `#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    // Your solution here\n    return 0;\n}`,
  c: `#include<stdio.h>\nint main(){\n    // Your solution here\n    return 0;\n}`,
};

// Anti-cheat thresholds
const MAX_FULLSCREEN_EXITS = 2;
const MAX_TAB_SWITCHES = 3;
const MAX_VIOLATIONS = 5;

function formatTime(s) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function DiffBadge({ diff }) {
  const map = {
    Easy: "bg-green-100 text-green-700 border-green-400",
    Medium: "bg-amber-100 text-amber-700 border-amber-400",
    Hard: "bg-red-100 text-red-600 border-red-400",
  };
  return (
    <span
      className={`text-xs font-black px-2.5 py-1 rounded-lg border-2 shadow-[2px_2px_0px_#000] ${map[diff] || ""}`}
    >
      {diff}
    </span>
  );
}

// ── Live Players Panel with Scoreboard ───────────────────────────────────────
function PlayersPanel({ participants, liveStatuses, myUserId, roomCode, currentQuestionIndex, totalQuestions }) {
  // Calculate scores based on solved questions
  const getPlayerScore = (userId) => {
    const status = liveStatuses[userId] || {};
    return status.solvedCount || 0;
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    const scoreA = getPlayerScore(a.userId);
    const scoreB = getPlayerScore(b.userId);
    if (scoreA !== scoreB) return scoreB - scoreA;
    // If scores are equal, sort by join order or username
    return a.username.localeCompare(b.username);
  });

  return (
    <div className="w-64 shrink-0 border-r-2 border-black bg-[#f8f8f8] flex flex-col overflow-hidden">
      <div className="border-b-2 border-black px-3 py-2.5 bg-[#f0fafa]">
        <p className="text-[10px] font-black uppercase tracking-widest text-black/50 flex items-center gap-1.5">
          <Trophy size={10} /> Scoreboard · {roomCode}
        </p>
        <p className="text-[9px] text-black/40 mt-0.5">
          Question {currentQuestionIndex + 1}/{totalQuestions}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sortedParticipants.map((p, idx) => {
          const live = liveStatuses[p.userId] || {};
          const isMe = p.userId === myUserId;
          const status = live.status;
          const score = live.solvedCount || 0;
          const disconnected = live.disconnected;
          const currentSubmitting = live.isSubmitting;

          return (
            <div
              key={p.userId}
              className={`rounded-xl border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] ${isMe ? "bg-white" : "bg-[#f0fafa]"}`}
            >
              {/* Rank and Name */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-black text-black/40 w-5">
                    #{idx + 1}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-lg border-2 border-black flex items-center justify-center text-[10px] font-black shrink-0 ${isMe ? "bg-[rgb(238,11,22)] text-white" : "bg-white"}`}
                  >
                    {p.username[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-black text-black truncate">
                    {isMe ? "You" : p.username}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black text-[rgb(238,11,22)]">
                    {score}
                  </span>
                  <span className="text-[9px] font-black text-black/40">
                    /{totalQuestions}
                  </span>
                  {disconnected && (
                    <WifiOff size={11} className="text-red-400 shrink-0" />
                  )}
                </div>
              </div>

              {/* Current Question Status */}
              <div className="flex items-center justify-between gap-1">
                {currentSubmitting ? (
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 flex-1">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <AlertCircle size={10} className="text-amber-500" />
                    </motion.div>
                    <span className="text-[9px] font-black text-amber-600">
                      Judging...
                    </span>
                  </div>
                ) : status === "AC" ? (
                  <div className="flex items-center gap-1 bg-green-100 border border-green-400 rounded-lg px-2 py-1 flex-1">
                    <CheckCircle size={10} className="text-green-600" />
                    <span className="text-[9px] font-black text-green-700">
                      Solved!
                    </span>
                  </div>
                ) : status && status !== "pending" ? (
                  <div className="flex items-center justify-between bg-[#f0fafa] border border-black/10 rounded-lg px-2 py-1 flex-1">
                    <span
                      className={`text-[9px] font-black ${status === "WA" ? "text-red-500" : status === "RE" || status === "CE" ? "text-orange-500" : "text-black/50"}`}
                    >
                      {status}
                    </span>
                    {live.passed !== undefined && live.total !== undefined && (
                      <span className="text-[9px] font-black text-black/50">
                        {live.passed}/{live.total}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#e8e8e8] border border-black/10 rounded-lg px-2 py-1 flex-1">
                    <span className="text-[9px] font-bold text-black/30">
                      Working...
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Battle Result Modal (room version with 4 questions) ──────────────────────
function RoomResultModal({ result, myUserId, onClose }) {
  const { winnerId, reason, duration, participants, totalQuestions } = result;
  const isWinner = winnerId === myUserId;
  const isDraw = !winnerId;

  const sorted = [...participants].sort((a, b) => {
    if (a.solvedCount !== b.solvedCount) return b.solvedCount - a.solvedCount;
    return (a.totalTime || 0) - (b.totalTime || 0);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 30 }}
        className="bg-white border-2 border-black shadow-[10px_10px_0px_#000] rounded-2xl p-7 w-full max-w-md"
      >
        <div
          className={`text-center mb-6 p-5 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] ${isDraw ? "bg-gray-100" : isWinner ? "bg-green-100" : "bg-red-100"}`}
        >
          <div className="text-4xl mb-2">
            {isDraw ? "🤝" : isWinner ? "🏆" : "💀"}
          </div>
          <h2
            className={`text-2xl font-black ${isDraw ? "text-gray-700" : isWinner ? "text-green-700" : "text-red-600"}`}
          >
            {isDraw ? "Draw!" : isWinner ? "You Won!" : "You Lost!"}
          </h2>
          <p className="text-xs font-black text-black/40 uppercase tracking-widest mt-1">
            {reason === "solved"
              ? "First to solve all questions"
              : reason === "timeout"
                ? "Time's up"
                : reason === "forfeit"
                  ? "Forfeit"
                  : "Disconnect"}
            {" · "}
            {Math.floor(duration / 60)}m {duration % 60}s
          </p>
        </div>

        {/* Leaderboard */}
        <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
          {sorted.map((p, i) => {
            const isMe = p.userId === myUserId;
            return (
              <div
                key={p.userId}
                className={`flex items-center justify-between rounded-xl border-2 border-black px-3 py-2.5 shadow-[2px_2px_0px_#000] ${isMe ? "bg-[rgb(238,11,22)]/10" : "bg-[#f8f8f8]"}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-black text-black/40 w-4">
                    {i + 1}
                  </span>
                  <span className="text-sm font-black text-black">
                    {isMe ? "You" : p.username}
                    {p.userId === winnerId && " 🏆"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[rgb(238,11,22)]">
                    {p.solvedCount}/{totalQuestions}
                  </span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-lg border border-black ${p.ratingChange >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                  >
                    {p.ratingChange >= 0 ? "+" : ""}
                    {p.ratingChange}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-black text-white font-black text-sm uppercase tracking-widest border-2 border-black rounded-xl shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Back to Lobby
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Question Navigator Component ─────────────────────────────────────────────
function QuestionNavigator({ questions, currentIndex, onSelect, solvedStatus }) {
  return (
    <div className="border-t-2 border-black bg-[#f0fafa] p-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`relative shrink-0 w-10 h-10 rounded-xl border-2 border-black font-black text-sm transition-all shadow-[2px_2px_0px_#000] ${
              currentIndex === idx
                ? "bg-[rgb(238,11,22)] text-white scale-105"
                : solvedStatus[idx]
                  ? "bg-green-100 text-green-700"
                  : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            {idx + 1}
            {solvedStatus[idx] && (
              <CheckCircle
                size={12}
                className="absolute -top-1 -right-1 text-green-600 bg-white rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Room Arena Page ─────────────────────────────────────────────────────
export default function RoomArenaPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { timeLeft, startTimer, stopTimer, resetRoom } = useBattleStore();

  const roomBattle = useBattleStore((s) => s.roomBattle);
  const roomCode = useBattleStore((s) => s.roomCode);

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(STARTER_CODE["javascript"]);
  const [customInput, setCustomInput] = useState("");
  const [activeTab, setActiveTab] = useState("problem");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [battleResult, setBattleResult] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [solvedQuestions, setSolvedQuestions] = useState({});

  // Anti-cheat states
  const [violations, setViolations] = useState(0);
  const [focusLostCount, setFocusLostCount] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [hasAutoForfeited, setHasAutoForfeited] = useState(false);

  // Live statuses for all players
  const [liveStatuses, setLiveStatuses] = useState({});

  const editorRef = useRef(null);
  const violationIntervalRef = useRef(null);
  const myUserId = user?._id?.toString();

  const isBattleActive = !!roomBattle && !battleResult;
  const currentProblem = roomBattle?.questions?.[currentQuestionIndex];
  const totalQuestions = roomBattle?.questions?.length || 4;
  const isCurrentSolved = solvedQuestions[currentQuestionIndex];

  // Auto-forfeit function
  const autoForfeit = useCallback(
    (reason) => {
      if (!isBattleActive || hasAutoForfeited || !roomBattle?.battleId) return;

      setHasAutoForfeited(true);
      toast.error(`⚠️ Disqualified: ${reason}`, { duration: 5000 });

      setTimeout(() => {
        const socket = getSocket();
        if (socket) {
          socket.emit("room:forfeit", { 
            battleId: roomBattle.battleId, 
            roomId: roomBattle.roomId 
          });
        }
      }, 1000);
    },
    [isBattleActive, hasAutoForfeited, roomBattle],
  );

  // Check violation thresholds
  useEffect(() => {
    if (!isBattleActive || hasAutoForfeited) return;

    if (fullscreenExits >= MAX_FULLSCREEN_EXITS) {
      autoForfeit(`Exited fullscreen ${fullscreenExits} times`);
    } else if (focusLostCount >= MAX_TAB_SWITCHES) {
      autoForfeit(`Switched tabs ${focusLostCount} times`);
    } else if (Math.floor(violations) >= MAX_VIOLATIONS) {
      autoForfeit(`Too many rule violations (${Math.floor(violations)})`);
    }
  }, [fullscreenExits, focusLostCount, violations, isBattleActive, hasAutoForfeited, autoForfeit]);

  // ── Guard: must have roomBattle ──
  useEffect(() => {
    if (!roomBattle) navigate("/battle/room");
  }, [roomBattle, navigate]);

  useEffect(() => {
    setCode(STARTER_CODE[language] || "");
  }, [language]);

  // Update code when switching questions
  useEffect(() => {
    if (currentProblem?.starterCode?.[language]) {
      setCode(currentProblem.starterCode[language]);
    } else {
      setCode(STARTER_CODE[language] || "");
    }
    setSubmissionResult(null);
    setActiveTab("problem");
  }, [currentQuestionIndex, language, currentProblem]);

  // Fullscreen detection
  useEffect(() => {
    if (!isBattleActive) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;

      if (!isCurrentlyFullscreen && isFullscreen) {
        setFullscreenExits((prev) => {
          const newCount = prev + 1;
          const remaining = MAX_FULLSCREEN_EXITS - newCount;
          if (remaining > 0) {
            toast.error(
              `⚠️ Fullscreen required! ${remaining} warning${remaining === 1 ? "" : "s"} remaining.`,
              { duration: 4000 }
            );
          }
          return newCount;
        });
        setViolations((prev) => prev + 2);
        requestFullscreen();
      }
      setIsFullscreen(!!document.fullscreenElement);
    };

    const requestFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.warn("Fullscreen request failed:", err);
      }
    };

    setIsFullscreen(!!document.fullscreenElement);
    if (!document.fullscreenElement) {
      requestFullscreen();
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isBattleActive, isFullscreen]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabActive(isVisible);

      if (!isVisible && isBattleActive) {
        setFocusLostCount((prev) => {
          const newCount = prev + 1;
          const remaining = MAX_TAB_SWITCHES - newCount;
          if (remaining > 0) {
            toast.error(
              `⚠️ Tab switching detected! ${remaining} warning${remaining === 1 ? "" : "s"} remaining.`,
              { duration: 3000 }
            );
          }
          return newCount;
        });
        setViolations((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isBattleActive]);

  // Periodic checks
  useEffect(() => {
    if (!isBattleActive) return;

    violationIntervalRef.current = setInterval(() => {
      if (!document.hasFocus() && isBattleActive && !hasAutoForfeited) {
        setFocusLostCount((prev) => prev + 1);
        setViolations((prev) => prev + 1);
      }
      if (!document.fullscreenElement && isBattleActive && !hasAutoForfeited) {
        setFullscreenExits((prev) => prev + 1);
        setViolations((prev) => prev + 2);
        document.documentElement.requestFullscreen().catch(console.warn);
      }
    }, 5000);

    return () => {
      if (violationIntervalRef.current) {
        clearInterval(violationIntervalRef.current);
      }
    };
  }, [isBattleActive, hasAutoForfeited]);

  // Global copy/paste blocking
  useEffect(() => {
    if (!isBattleActive) return;

    const handleGlobalCopy = (e) => {
      e.preventDefault();
      toast.error("Copying is disabled during battle!", { duration: 1500 });
      setViolations((prev) => prev + 0.5);
      return false;
    };

    const handleGlobalPaste = (e) => {
      e.preventDefault();
      toast.error("Pasting is disabled during battle!", { duration: 1500 });
      setViolations((prev) => prev + 1);
      return false;
    };

    document.addEventListener("copy", handleGlobalCopy);
    document.addEventListener("cut", handleGlobalCopy);
    document.addEventListener("paste", handleGlobalPaste);

    return () => {
      document.removeEventListener("copy", handleGlobalCopy);
      document.removeEventListener("cut", handleGlobalCopy);
      document.removeEventListener("paste", handleGlobalPaste);
    };
  }, [isBattleActive]);

  // Keyboard shortcut blocking
  useEffect(() => {
    if (!isBattleActive) return;

    const blockedKeys = ["F12", "F5", "F8", "F11", "Control", "Alt", "Meta"];
    const blockedCombos = [
      { ctrl: true, key: "u" },
      { ctrl: true, shift: true, key: "i" },
      { ctrl: true, shift: true, key: "c" },
      { ctrl: true, shift: true, key: "j" },
      { ctrl: true, key: "s" },
      { ctrl: true, key: "r" },
    ];

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen && isBattleActive) {
        e.preventDefault();
        toast.warning("⚠️ Escape exits fullscreen and counts as violation!", {
          duration: 2000,
        });
        setFullscreenExits((prev) => prev + 1);
        setViolations((prev) => prev + 2);
        return false;
      }

      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        setViolations((prev) => prev + 0.5);
        return false;
      }

      for (const combo of blockedCombos) {
        if (
          (!combo.ctrl || e.ctrlKey) &&
          (!combo.shift || e.shiftKey) &&
          (!combo.alt || e.altKey) &&
          e.key.toLowerCase() === combo.key
        ) {
          e.preventDefault();
          setViolations((prev) => prev + 1);
          return false;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBattleActive, isFullscreen]);

  // Context menu prevention
  useEffect(() => {
    if (!isBattleActive) return;

    const preventContextMenu = (e) => {
      e.preventDefault();
      setViolations((prev) => prev + 0.5);
      return false;
    };

    document.addEventListener("contextmenu", preventContextMenu);
    return () => document.removeEventListener("contextmenu", preventContextMenu);
  }, [isBattleActive]);

  // ── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomBattle) return;

    socket.emit("battle:join_room", { roomId: roomBattle.roomId });
    startTimer(roomBattle.timeLimit);

    // My submission result
    socket.on("room:submission_result", (result) => {
      setIsSubmitting(false);
      setSubmissionResult(result);
      setActiveTab("results");

      if (result.status === "AC") {
        toast.success(`Question ${currentQuestionIndex + 1} solved! 🎉`);
        setSolvedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: true }));
        
        // Move to next question if available
        if (currentQuestionIndex + 1 < totalQuestions) {
          setTimeout(() => {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          }, 1500);
        }
      } else if (result.status === "WA") {
        toast.error(`Wrong Answer — ${result.passed}/${result.total}`);
      } else if (result.status === "RE") {
        toast.error("Runtime Error");
      } else if (result.status === "CE") {
        toast.error("Compilation Error");
      }
    });

    socket.on("room:submission_pending", () => setIsSubmitting(true));

    // Live status updates
    socket.on("room:submission_update", ({ userId, status, passed, total, questionIndex, solvedCount }) => {
      setLiveStatuses((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          status,
          passed,
          total,
          isSubmitting: false,
          solvedCount: solvedCount || Object.values(solvedQuestions).filter(Boolean).length,
        },
      }));
    });

    socket.on("room:opponent_submitting", ({ userId }) => {
      setLiveStatuses((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], isSubmitting: true },
      }));
    });

    socket.on("room:run_result", (result) => {
      setRunResult(result);
      setActiveTab("output");
    });

    socket.on("room:opponent_disconnected", ({ userId }) => {
      setLiveStatuses((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], disconnected: true },
      }));
      toast("A player disconnected — 30s grace period", { icon: "⚠️" });
    });

    socket.on("room:battle_ended", (result) => {
      stopTimer();
      setBattleResult(result);
    });

    return () => {
      socket.off("room:submission_result");
      socket.off("room:submission_pending");
      socket.off("room:submission_update");
      socket.off("room:opponent_submitting");
      socket.off("room:run_result");
      socket.off("room:opponent_disconnected");
      socket.off("room:battle_ended");
    };
  }, [roomBattle, startTimer, stopTimer, currentQuestionIndex, totalQuestions]);

  if (!roomBattle) return null;

  const { battleId, participants, roomId } = roomBattle;
  const isTimeCritical = timeLeft <= 120;
  const solvedCount = Object.values(solvedQuestions).filter(Boolean).length;

  const handleSubmit = () => {
    if (!code.trim()) {
      toast.error("Write some code first!");
      return;
    }
    if (isCurrentSolved) {
      toast.error("You already solved this question!");
      return;
    }
    if (violations >= MAX_VIOLATIONS) {
      toast.error("Too many violations! Match will be forfeited.");
      autoForfeit("Exceeded violation limit");
      return;
    }

    const socket = getSocket();
    if (!socket) return;
    setIsSubmitting(true);
    setSubmissionResult(null);
    socket.emit("room:submit", { 
      battleId, 
      code, 
      language, 
      questionIndex: currentQuestionIndex 
    });
    toast("Judging...", { icon: "⚙️" });
  };

  const handleRun = () => {
    if (!code.trim()) {
      toast.error("Write some code first!");
      return;
    }
    const socket = getSocket();
    if (!socket) return;
    socket.emit("room:run_code", { code, language, input: customInput });
    toast("Running...", { icon: "▶️" });
  };

  const handleForfeit = () => {
    if (!window.confirm("Forfeit this battle?")) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("room:forfeit", { battleId, roomId });
  };

  const handleClose = () => {
    stopTimer();
    resetRoom();
    navigate("/battle");
  };

  const handleQuestionChange = (index) => {
    if (index !== currentQuestionIndex) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      toast.error("Paste is disabled during battles.", { duration: 2000 });
      setViolations((prev) => prev + 1);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      toast.error("Copy is disabled during battles.", { duration: 2000 });
      setViolations((prev) => prev + 0.5);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {
      toast.error("Cut is disabled during battles.", { duration: 2000 });
      setViolations((prev) => prev + 0.5);
    });

    editor.updateOptions({ contextmenu: false });
  };

  const TABS = ["problem", "results", "output"];
  const remainingFullscreenExits = Math.max(0, MAX_FULLSCREEN_EXITS - fullscreenExits);
  const remainingTabSwitches = Math.max(0, MAX_TAB_SWITCHES - focusLostCount);

  return (
    <div className="h-screen bg-[rgb(238,11,22)] flex flex-col overflow-hidden">
      {/* Fullscreen warning overlay */}
      <AnimatePresence>
        {!isFullscreen && isBattleActive && !hasAutoForfeited && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <div className="bg-white border-4 border-black rounded-2xl p-8 text-center max-w-md mx-4 shadow-[12px_12px_0px_#000]">
              <Maximize2 size={48} className="mx-auto mb-4 text-[rgb(238,11,22)]" />
              <h2 className="text-2xl font-black mb-2">Fullscreen Required!</h2>
              <p className="text-black/60 mb-4">
                You must be in fullscreen mode to continue the battle.
              </p>
              <button
                onClick={() => document.documentElement.requestFullscreen()}
                className="bg-[rgb(238,11,22)] text-white font-black px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] transition-all"
              >
                Enter Fullscreen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-13 bg-white border-b-2 border-black flex items-center px-4 gap-4 shrink-0 z-10 py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black text-white rounded flex items-center justify-center font-black text-sm">
            C
          </div>
          <span className="font-black text-black text-base tracking-tight hidden sm:block">
            CodeX Arena
          </span>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 bg-[#f0fafa] border-2 border-black rounded-xl px-3 py-1 shadow-[2px_2px_0px_#000]">
          <Trophy size={13} className="text-[rgb(238,11,22)]" />
          <span className="text-xs font-black text-black">
            {solvedCount}/{totalQuestions} Solved
          </span>
        </div>

        <div className="flex-1" />

        {/* Timer */}
        <div
          className={`flex items-center gap-1.5 font-black text-lg border-2 border-black px-3 py-1 rounded-xl shadow-[2px_2px_0px_#000] ${isTimeCritical ? "bg-red-100 text-red-600 animate-pulse" : "bg-white text-black"}`}
        >
          <Clock size={15} />
          {formatTime(timeLeft)}
        </div>

        {/* Violation counter */}
        {(violations > 0 || fullscreenExits > 0 || focusLostCount > 0) && (
          <div className="flex flex-col items-end gap-0.5">
            <div
              className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg shadow-[2px_2px_0px_#000] ${
                violations >= MAX_VIOLATIONS
                  ? "bg-red-100 text-red-700 border-2 border-red-500"
                  : "bg-amber-100 text-amber-700 border-2 border-amber-400"
              }`}
            >
              <ShieldAlert size={12} />
              {Math.floor(violations)}/{MAX_VIOLATIONS}
            </div>
            <div className="flex gap-2 text-[10px] font-black">
              {fullscreenExits > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                  🖥️ {remainingFullscreenExits}/{MAX_FULLSCREEN_EXITS}
                </span>
              )}
              {focusLostCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                  🔄 {remainingTabSwitches}/{MAX_TAB_SWITCHES}
                </span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleForfeit}
          className="flex items-center gap-1 text-xs font-black text-black border-2 border-black px-2 py-1.5 rounded-lg hover:bg-red-100 transition-colors shadow-[2px_2px_0px_#000]"
        >
          <Flag size={12} /> Forfeit
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Players Panel */}
        <PlayersPanel
          participants={participants}
          liveStatuses={liveStatuses}
          myUserId={myUserId}
          roomCode={roomCode}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
        />

        {/* MIDDLE: Problem Panel */}
        <div className="w-[420px] shrink-0 border-r-2 border-black flex flex-col overflow-hidden bg-white">
          <div className="flex border-b-2 border-black shrink-0 bg-[#f0fafa]">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-r-2 border-black last:border-r-0 ${
                  activeTab === t
                    ? "bg-[rgb(238,11,22)] text-white"
                    : "text-black/40 hover:text-black hover:bg-[#e0e8e8]"
                }`}
              >
                {t}
                {t === "results" && submissionResult && (
                  <span
                    className={`ml-1.5 inline-block w-2 h-2 rounded-full border border-black ${
                      submissionResult.status === "AC" ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "problem" && currentProblem && (
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-black text-black leading-tight">
                    {currentQuestionIndex + 1}. {currentProblem.title}
                  </h2>
                  <DiffBadge diff={currentProblem.difficulty} />
                </div>

                {currentProblem.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentProblem.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-[#e0f8f8] text-black font-bold px-2 py-0.5 rounded-lg border-2 border-black/20"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-sm text-black/70 leading-relaxed whitespace-pre-wrap font-medium">
                  {currentProblem.description}
                </div>

                {currentProblem.constraints && (
                  <div className="bg-[#f0fafa] border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000]">
                    <p className="text-xs font-black text-black uppercase tracking-wider mb-1.5">
                      Constraints
                    </p>
                    <p className="text-xs text-black/60 font-mono whitespace-pre-wrap">
                      {currentProblem.constraints}
                    </p>
                  </div>
                )}

                {currentProblem.examples?.map((ex, i) => (
                  <div
                    key={i}
                    className="border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_#000]"
                  >
                    <div className="bg-[#f0fafa] border-b-2 border-black px-3 py-2">
                      <p className="text-xs font-black text-black uppercase">
                        Example {i + 1}
                      </p>
                    </div>
                    <div className="p-3 space-y-2 bg-white">
                      <div>
                        <p className="text-xs text-black/40 font-bold mb-1">
                          Input:
                        </p>
                        <pre className="text-xs text-green-700 font-mono bg-green-50 border border-green-200 rounded-lg p-2 whitespace-pre-wrap">
                          {ex.input}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs text-black/40 font-bold mb-1">
                          Output:
                        </p>
                        <pre className="text-xs text-blue-700 font-mono bg-blue-50 border border-blue-200 rounded-lg p-2 whitespace-pre-wrap">
                          {ex.output}
                        </pre>
                      </div>
                      {ex.explanation && (
                        <p className="text-xs text-black/50 italic">
                          {ex.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="text-xs text-black/40 font-bold flex items-center gap-3 pt-1">
                  <span>
                    {currentProblem.sampleTestCases?.length || 0} sample tests visible
                  </span>
                  <span>·</span>
                  <span>{currentProblem.totalTestCases} total test cases</span>
                </div>

                {isCurrentSolved && (
                  <div className="bg-green-100 border-2 border-green-500 rounded-xl p-3 text-center">
                    <CheckCircle size={20} className="inline mr-2 text-green-600" />
                    <span className="font-black text-green-700">Question Solved!</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "results" && (
              <div className="p-4 space-y-3">
                {!submissionResult ? (
                  <div className="text-center text-black/30 text-sm py-12 font-bold">
                    Submit to see results
                  </div>
                ) : (
                  <>
                    <div
                      className={`rounded-xl p-4 border-2 border-black shadow-[3px_3px_0px_#000] ${
                        submissionResult.status === "AC" ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {submissionResult.status === "AC" ? (
                          <CheckCircle className="text-green-600" size={24} />
                        ) : (
                          <XCircle className="text-red-500" size={24} />
                        )}
                        <div>
                          <p
                            className={`font-black text-lg ${
                              submissionResult.status === "AC" ? "text-green-700" : "text-red-600"
                            }`}
                          >
                            {submissionResult.status === "AC"
                              ? "Accepted!"
                              : submissionResult.status === "WA"
                                ? "Wrong Answer"
                                : submissionResult.status === "RE"
                                  ? "Runtime Error"
                                  : submissionResult.status === "CE"
                                    ? "Compile Error"
                                    : submissionResult.status}
                          </p>
                          <p className="text-sm text-black/60 font-bold">
                            {submissionResult.passed}/{submissionResult.total} passed
                          </p>
                        </div>
                      </div>
                    </div>

                    {submissionResult.errorMessage && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3">
                        <p className="text-xs font-black text-red-500 mb-1">
                          Error:
                        </p>
                        <pre className="text-xs text-black/70 whitespace-pre-wrap font-mono">
                          {submissionResult.errorMessage}
                        </pre>
                      </div>
                    )}

                    <div className="space-y-2">
                      {submissionResult.results?.map((r, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000] ${
                            r.passed ? "bg-green-50" : "bg-red-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-black/50">
                              {r.isPublic ? `Test Case ${r.testCase}` : `Hidden Test ${r.testCase}`}
                            </span>
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-lg border border-black ${
                                r.passed ? "bg-green-200 text-green-700" : "bg-red-200 text-red-600"
                              }`}
                            >
                              {r.passed ? "PASS ✓" : "FAIL ✗"}
                            </span>
                          </div>
                          {r.isPublic && (
                            <div className="space-y-1">
                              <div>
                                <span className="text-xs text-black/40 font-bold">
                                  In:{" "}
                                </span>
                                <code className="text-xs font-mono">{r.input}</code>
                              </div>
                              <div>
                                <span className="text-xs text-black/40 font-bold">
                                  Expected:{" "}
                                </span>
                                <code className="text-xs font-mono text-green-700">
                                  {r.expectedOutput}
                                </code>
                              </div>
                              {!r.passed && (
                                <div>
                                  <span className="text-xs text-black/40 font-bold">
                                    Got:{" "}
                                  </span>
                                  <code className="text-xs font-mono text-red-600">
                                    {r.actualOutput}
                                  </code>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "output" && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-black text-black uppercase tracking-widest mb-1.5 block">
                    Custom Input
                  </label>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter input here..."
                    rows={4}
                    className="w-full bg-[#f0fafa] border-2 border-black rounded-xl p-3 text-sm text-black font-mono placeholder-black/25 focus:outline-none focus:border-[rgb(238,11,22)] resize-none shadow-[2px_2px_0px_#000]"
                  />
                </div>
                {runResult && (
                  <div>
                    <label className="text-xs font-black text-black uppercase tracking-widest mb-1.5 block">
                      Output
                    </label>
                    <pre
                      className={`border-2 border-black rounded-xl p-3 text-xs font-mono whitespace-pre-wrap shadow-[2px_2px_0px_#000] ${
                        runResult.error ? "bg-red-50 text-red-600" : "bg-[#f0fafa] text-green-700"
                      }`}
                    >
                      {runResult.output || "(no output)"}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Question Navigator */}
          <QuestionNavigator
            questions={roomBattle.questions}
            currentIndex={currentQuestionIndex}
            onSelect={handleQuestionChange}
            solvedStatus={solvedQuestions}
          />
        </div>

        {/* RIGHT: Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-11 border-b-2 border-black bg-[#f0fafa] flex items-center px-4 gap-3 shrink-0">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white border-2 border-black text-black text-sm rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer font-bold shadow-[2px_2px_0px_#000]"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>

            <div className="flex-1" />

            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black text-black font-black text-xs uppercase tracking-wider hover:bg-[rgb(238,11,22)] hover:text-white transition-all shadow-[2px_2px_0px_#000]"
            >
              <Play size={13} /> Run
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isCurrentSolved}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[rgb(238,11,22)] hover:bg-[rgb(218,8,20)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Judging...
                </>
              ) : isCurrentSolved ? (
                <>
                  <CheckCircle size={13} /> Solved!
                </>
              ) : (
                <>
                  <Send size={13} /> Submit
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(val) => setCode(val || "")}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "JetBrains Mono, Fira Code, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                lineNumbers: "on",
                wordWrap: "on",
                tabSize: 2,
                automaticLayout: true,
                contextmenu: false,
                suggestOnTriggerCharacters: false,
                quickSuggestions: false,
                parameterHints: { enabled: false },
                hover: { enabled: false },
              }}
            />
          </div>
        </div>
      </div>

      {/* Battle Result Modal */}
      <AnimatePresence>
        {battleResult && (
          <RoomResultModal
            result={battleResult}
            myUserId={myUserId}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
