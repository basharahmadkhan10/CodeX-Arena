import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import useBattleStore from "../store/battleStore";
import useAuthStore from "../store/authStore";
import BattleResultModal from "../components/battle/BattleResultModal";

const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
];

const STARTER_CODE = {
  javascript: `const lines = [];
process.stdin.on('data', d => lines.push(...d.toString().split('\\n')));
process.stdin.on('end', () => {
  // Your solution here
});`,
  python: `import sys
data = sys.stdin.read().split()
# Your solution here`,
  java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your solution here
    }
}`,
  cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // Your solution here
    return 0;
}`,
  c: `#include<stdio.h>
int main(){
    // Your solution here
    return 0;
}`,
};

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

const floatingShapes = [
  { size: 64, top: "8%", left: "2%", rotate: 15, shape: "sq" },
  { size: 80, top: "10%", right: "3%", rotate: 30, shape: "sq" },
  { size: 52, bottom: "18%", left: "4%", rotate: 45, shape: "di" },
  { size: 72, bottom: "24%", right: "2%", rotate: 20, shape: "sq" },
  { size: 44, top: "45%", left: "1%", rotate: 10, shape: "di" },
  { size: 58, top: "52%", right: "4%", rotate: 35, shape: "sq" },
];

// ── Searching Screen ─────────────────────────────────────────────────────────
function SearchingScreen({ onCancel }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[rgb(238,11,22)] flex flex-col relative overflow-hidden">
      {/* Floating shapes */}
      {floatingShapes.map((s, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            width: s.size,
            height: s.size,
            top: s.top,
            left: s.left,
            right: s.right,
            bottom: s.bottom,
            background: "#414141",
            borderRadius: s.shape === "di" ? "10px" : "14px",
            border: "2px solid rgba(0,0,0,0.12)",
            transform: `rotate(${s.rotate}deg)`,
            opacity: 0.7,
          }}
          animate={{
            y: [0, -14, 0],
            rotate: [s.rotate, s.rotate + 10, s.rotate],
          }}
          transition={{
            duration: 2.8 + i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Navbar */}
      <nav className="relative z-20 h-14 bg-white border-b-2 border-black flex items-center px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-[rgb(238,11,22)] text-xl tracking-tight">
            CodeX
          </span>
          <span className="font-bold text-lg">Arena</span>
        </div>
      </nav>

      {/* Center card */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] rounded-2xl p-10 text-center max-w-sm w-full"
        >
          {/* Spinner */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-black/10 border-t-[rgb(238,11,22)] rounded-full absolute inset-0"
            />
            <div className="w-20 h-20 flex items-center justify-center">
              <Users size={28} className="text-black/30" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-black mb-1">
            Finding Opponent{dots}
          </h2>
          <p className="text-black/40 font-semibold text-sm mb-2">
            Searching for a worthy challenger
          </p>

          <div className="flex items-center justify-center gap-2 mb-8">
            <span
              className="inline-block w-2 h-2 bg-[rgb(238,11,22)] rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="inline-block w-2 h-2 bg-[rgb(238,11,22)] rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="inline-block w-2 h-2 bg-[rgb(238,11,22)] rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>

          <div className="bg-[#f0fafa] border-2 border-black rounded-xl px-4 py-3 mb-6 shadow-[2px_2px_0px_#000]">
            <p className="text-xs font-black text-black/40 uppercase tracking-widest mb-0.5">
              Mode
            </p>
            <p className="text-sm font-black text-black">⚔️ 1v1 Duel Battle</p>
          </div>

          <button
            onClick={onCancel}
            className="w-full text-xs font-black uppercase tracking-widest border-2 border-black px-5 py-3 rounded-xl bg-white hover:bg-black hover:text-white transition-all shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Cancel Search
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Main Battle Page ─────────────────────────────────────────────────────────
export default function BattlePage() {
  const {
    battle,
    queueStatus,
    timeLeft,
    isSubmitting,
    submissionResult,
    runResult,
    opponentStatus,
    opponentSubmitting,
    battleResult,
    opponentDisconnected,
    submitCode,
    runCode,
    forfeit,
    leaveQueue,
    reset,
  } = useBattleStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(STARTER_CODE["javascript"]);
  const [customInput, setCustomInput] = useState("");
  const [activeTab, setActiveTab] = useState("problem");
  const editorRef = useRef(null);

  // ── Guard: if not searching and no battle → go home ──
  useEffect(() => {
    if (queueStatus === "idle" && !battle) {
      navigate("/");
    }
  }, [queueStatus, battle, navigate]);

  useEffect(() => {
    setCode(STARTER_CODE[language] || "");
  }, [language]);

  useEffect(() => {
    if (submissionResult) {
      if (submissionResult.status === "AC")
        toast.success(`All ${submissionResult.total} tests passed!`, {
          duration: 5000,
        });
      else if (submissionResult.status === "WA")
        toast.error(
          `Wrong Answer — ${submissionResult.passed}/${submissionResult.total}`,
        );
      else if (submissionResult.status === "RE") toast.error("Runtime Error");
      else if (submissionResult.status === "CE")
        toast.error("Compilation Error");
      setActiveTab("results");
    }
  }, [submissionResult]);

  useEffect(() => {
    if (runResult) setActiveTab("output");
  }, [runResult]);

  useEffect(() => {
    if (battleResult) {
      const timer = setTimeout(() => {
        reset();
        navigate("/");
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [battleResult]);

  // Cancel matchmaking
  const handleCancel = () => {
    leaveQueue();
    navigate("/");
  };

  // ── Show searching screen while in queue ──
  if (queueStatus === "searching" && !battle) {
    return <SearchingScreen onCancel={handleCancel} />;
  }

  // ── Safety: nothing to show ──
  if (!battle) return null;

  const { problem, you, opponent } = battle;
  const isTimeCritical = timeLeft <= 120;
  const myAC = submissionResult?.status === "AC";

  const handleSubmit = () => {
    if (!code.trim()) {
      toast.error("Write some code first!");
      return;
    }
    submitCode(battle.battleId, code, language);
    toast("Judging...", { icon: "⚙️" });
  };

  const handleRun = () => {
    if (!code.trim()) {
      toast.error("Write some code first!");
      return;
    }
    runCode(code, language, customInput);
    toast("Running...", { icon: "▶️" });
  };

  const handleForfeit = () => {
    if (!window.confirm("Forfeit this battle?")) return;
    forfeit(battle.battleId);
  };

  const TABS = ["problem", "results", "output"];

  return (
    <div className="h-screen bg-[rgb(238,11,22)] flex flex-col overflow-hidden">
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

        {/* Players */}
        <div className="flex-1 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-white border-2 border-black rounded-xl px-3 py-1 shadow-[2px_2px_0px_#000]">
            <span className="text-sm font-black text-[rgb(238,11,22)]">
              {you?.username}
            </span>
            {myAC && <CheckCircle size={14} className="text-green-600" />}
          </div>

          <div className="bg-black text-white font-black text-xs px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000]">
            VS
          </div>

          <div className="flex items-center gap-2 bg-white border-2 border-black rounded-xl px-3 py-1 shadow-[2px_2px_0px_#000]">
            {opponentDisconnected ? (
              <WifiOff size={13} className="text-red-500" />
            ) : opponentStatus?.status === "AC" ? (
              <CheckCircle size={13} className="text-red-500" />
            ) : opponentSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <AlertCircle size={13} className="text-amber-500" />
              </motion.div>
            ) : null}
            <span className="text-sm font-black text-black/70">
              {opponent?.username}
            </span>
          </div>
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-1.5 font-black text-lg border-2 border-black px-3 py-1 rounded-xl shadow-[2px_2px_0px_#000] ${
            isTimeCritical
              ? "bg-red-100 text-red-600 animate-pulse"
              : "bg-white text-black"
          }`}
        >
          <Clock size={15} />
          {formatTime(timeLeft)}
        </div>

        <button
          onClick={handleForfeit}
          className="flex items-center gap-1 text-xs font-black text-black border-2 border-black px-2 py-1.5 rounded-lg hover:bg-red-100 hover:border-red-500 transition-colors shadow-[2px_2px_0px_#000]"
        >
          <Flag size={12} /> Forfeit
        </button>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Problem panel */}
        <div className="w-[420px] shrink-0 border-r-2 border-black flex flex-col overflow-hidden bg-white">
          {/* Tabs */}
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
                      submissionResult.status === "AC"
                        ? "bg-green-400"
                        : "bg-red-400"
                    }`}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* PROBLEM TAB */}
            {activeTab === "problem" && problem && (
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-black text-black leading-tight">
                    {problem.title}
                  </h2>
                  <DiffBadge diff={problem.difficulty} />
                </div>

                {problem.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {problem.tags.map((t) => (
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
                  {problem.description}
                </div>

                {problem.constraints && (
                  <div className="bg-[#f0fafa] border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000]">
                    <p className="text-xs font-black text-black uppercase tracking-wider mb-1.5">
                      Constraints
                    </p>
                    <p className="text-xs text-black/60 font-mono whitespace-pre-wrap">
                      {problem.constraints}
                    </p>
                  </div>
                )}

                {problem.examples?.map((ex, i) => (
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
                    {problem.sampleTestCases?.length || 0} sample tests visible
                  </span>
                  <span>·</span>
                  <span>{problem.totalTestCases} total test cases</span>
                </div>
              </div>
            )}

            {/* RESULTS TAB */}
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
                        submissionResult.status === "AC"
                          ? "bg-green-100"
                          : "bg-red-100"
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
                            className={`font-black text-lg ${submissionResult.status === "AC" ? "text-green-700" : "text-red-600"}`}
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
                            {submissionResult.passed}/{submissionResult.total}{" "}
                            passed
                          </p>
                        </div>
                      </div>
                    </div>

                    {submissionResult.errorMessage && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 shadow-[2px_2px_0px_#000]">
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
                          className={`rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000] ${r.passed ? "bg-green-50" : "bg-red-50"}`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-black/50">
                              {r.isPublic
                                ? `Test Case ${r.testCase}`
                                : `Hidden Test ${r.testCase}`}
                            </span>
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-lg border border-black ${
                                r.passed
                                  ? "bg-green-200 text-green-700"
                                  : "bg-red-200 text-red-600"
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
                                <code className="text-xs font-mono text-black">
                                  {r.input}
                                </code>
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
                          {!r.isPublic && (
                            <p className="text-xs text-black/40 italic">
                              {r.actualOutput}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {opponentStatus && (
                      <div className="bg-[#f0fafa] border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000]">
                        <p className="text-xs font-black text-black/50 uppercase tracking-wider mb-1">
                          Opponent
                        </p>
                        <p
                          className={`text-sm font-black ${opponentStatus.status === "AC" ? "text-red-500" : "text-black"}`}
                        >
                          {opponentStatus.status === "AC"
                            ? `⚡ Solved! (${opponentStatus.passed}/${opponentStatus.total})`
                            : `${opponentStatus.passed}/${opponentStatus.total} passed`}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* OUTPUT TAB */}
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
                        runResult.error
                          ? "bg-red-50 text-red-600"
                          : "bg-[#f0fafa] text-green-700"
                      }`}
                    >
                      {runResult.output || "(no output)"}
                    </pre>
                    {runResult.cpuTime && (
                      <p className="text-xs text-black/40 font-bold mt-1">
                        CPU: {runResult.cpuTime}s
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="h-11 border-b-2 border-black bg-[#f0fafa] flex items-center px-4 gap-3 shrink-0">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white border-2 border-black text-black text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[rgb(238,11,22)] cursor-pointer font-bold shadow-[2px_2px_0px_#000]"
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
              disabled={isSubmitting || myAC}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[rgb(238,11,22)] hover:bg-[rgb(218,8,20)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Judging...
                </>
              ) : myAC ? (
                <>
                  <CheckCircle size={13} /> Accepted!
                </>
              ) : (
                <>
                  <Send size={13} /> Submit
                </>
              )}
            </button>
          </div>

          {/* Monaco */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(val) => setCode(val || "")}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
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
              }}
            />
          </div>
        </div>
      </div>

      {/* Battle Result Modal */}
      <AnimatePresence>
        {battleResult && (
          <BattleResultModal
            result={battleResult}
            you={you}
            onClose={() => {
              reset();
              navigate("/");
            }}
          />
        )}
      </AnimatePresence>

      {/* Disconnect banner */}
      <AnimatePresence>
        {opponentDisconnected && !battleResult && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-amber-100 border-2 border-black text-black text-sm px-6 py-3 rounded-xl shadow-[4px_4px_0px_#000] font-black flex items-center gap-2 uppercase tracking-wider"
          >
            <WifiOff size={16} />
            Opponent disconnected — win in 30s if they don't return
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
