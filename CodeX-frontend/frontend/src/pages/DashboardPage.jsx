
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Swords,
  Trophy,
  TrendingUp,
  Users,
  Star,
  LogOut,
  Clock,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import useBattleStore from "../store/battleStore";
import api from "../services/api";

const RANK_STYLES = {
  Novice: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
  },
  Apprentice: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-400",
  },
  Warrior: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-400",
  },
  Expert: {
    bg: "bg-violet-100",
    text: "text-violet-700",
    border: "border-violet-400",
  },
  Master: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-400",
  },
  Grandmaster: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-400",
  },
};

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { queueStatus, queueSize, joinQueue, leaveQueue, battle } =
    useBattleStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (queueStatus === "matched" && battle) navigate("/battle/1v1");
  }, [queueStatus, battle, navigate]);

  useEffect(() => {
    api
      .get("/users/leaderboard")
      .then((r) => setLeaderboard(r.data.users || []))
      .catch(() => {});
    api
      .get("/battles/history?limit=5")
      .then((r) => setHistory(r.data.battles || []))
      .catch(() => {});
  }, []);

  const handleQueue = () => {
    if (queueStatus === "searching") {
      leaveQueue();
      toast("Left the queue");
    } else {
      joinQueue();
      toast("Searching for opponent...", { icon: "⚔️" });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const winRate = user?.totalBattles
    ? Math.round((user.wins / user.totalBattles) * 100)
    : 0;
  const rank = user?.rank || "Novice";
  const rankStyle = RANK_STYLES[rank] || RANK_STYLES.Novice;

  return (
    <div className="min-h-screen bg-[rgb(238,11,22)]">
      {/* Navbar */}
      <nav className="h-14 bg-[#ffffff] border-b-2 border-black flex items-center px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-[rgb(238,11,22)] text-xl tracking-tight">
            CodeX
          </span>
          <span className="font-bold text-lg">Arena</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] ${rankStyle.bg}`}
          >
            <span className={`text-xs font-black uppercase ${rankStyle.text}`}>
              {rank}
            </span>
            <span className="text-xs font-bold text-black">
              · {user?.rating} RP
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-bold text-black hover:bg-black/10 px-3 py-1.5 rounded-lg transition-colors border-2 border-black/20"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Welcome + Find Battle card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] rounded-2xl overflow-hidden"
          >
            {/* Header strip */}
            <div className="bg-[#ffffff] border-b-2 border-black px-7 py-5 flex items-center justify-between">
              <div>
                <p className="text-black/60 text-sm font-bold uppercase tracking-widest">
                  Welcome back
                </p>
                <h2 className="text-3xl font-black text-black">
                  {user?.username}
                  <span className="text-[rgb(238,11,22)]">.</span>
                </h2>
              </div>
              <div
                className={`px-4 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] ${rankStyle.bg}`}
              >
                <p
                  className={`text-sm font-black uppercase tracking-wider ${rankStyle.text}`}
                >
                  {rank}
                </p>
              </div>
            </div>

            <div className="px-7 py-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-7">
                {[
                  {
                    label: "Rating",
                    value: user?.rating,
                    icon: TrendingUp,
                    accent: "#eef2f2",
                  },
                  {
                    label: "Wins",
                    value: user?.wins,
                    icon: Trophy,
                    accent: "#eef2f2",
                  },
                  {
                    label: "Win Rate",
                    value: `${winRate}%`,
                    icon: Star,
                    accent: "#eef2f2",
                  },
                ].map(({ label, value, icon: Icon, accent }) => (
                  <div
                    key={label}
                    className="bg-[#f0fafa] border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_#000]"
                  >
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center mb-2 shadow-[2px_2px_0px_#000]"
                      style={{ background: accent }}
                    >
                      <Icon size={16} className="text-black" />
                    </div>
                    <p className="text-2xl font-black text-black">{value}</p>
                    <p className="text-xs font-bold text-black/50 uppercase tracking-wider mt-0.5">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Queue button */}
              <AnimatePresence mode="wait">
                {queueStatus === "searching" ? (
                  <motion.div
                    key="searching"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3 bg-[#e0f8f8] border-2 border-black rounded-xl px-5 py-4 shadow-[3px_3px_0px_#000]">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2.5 h-2.5 bg-[rgb(238,11,22)] rounded-full border border-black"
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-black font-black text-sm uppercase tracking-wider">
                        Finding opponent...
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-xs font-bold text-black/50 border border-black/20 rounded-lg px-2 py-1">
                        <Users size={12} /> {queueSize} in queue
                      </span>
                    </div>
                    <button
                      onClick={handleQueue}
                      className="w-full py-3 rounded-xl border-2 border-black text-black font-black text-sm uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all shadow-[3px_3px_0px_#000]"
                    >
                      Cancel Search ✕
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleQueue}
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 2, x: 2 }}
                    className="w-full bg-[rgb(238,11,22)] hover:bg-[rgb(218,8,20)] text-white font-black py-4 rounded-xl text-lg border-2 border-black shadow-[5px_5px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all flex items-center justify-center gap-3 uppercase tracking-wider"
                  >
                    <Swords size={22} />
                    FIND BATTLE
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Recent Battles */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock size={13} /> Recent Battles
            </h3>
            {history.length === 0 ? (
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-xl p-8 text-center">
                <p className="text-black/40 text-sm font-bold">
                  No battles yet — find your first match!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map((b, idx) => {
                  const me = b.participants?.find(
                    (p) => p.user?._id === user?._id || p.user === user?._id,
                  );
                  const opp = b.participants?.find(
                    (p) => p.user?._id !== user?._id && p.user !== user?._id,
                  );
                  const isWin =
                    b.winner === user?._id || b.winner?._id === user?._id;
                  const isDraw = !b.winner;
                  const change = me?.ratingChange || 0;

                  return (
                    <motion.div
                      key={b._id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="flex items-center gap-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000] rounded-xl px-5 py-3.5 hover:bg-[#f0fafa] transition-colors"
                    >
                      <div
                        className={`w-14 text-center py-1 rounded-lg border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_#000] ${
                          isDraw
                            ? "bg-gray-100 text-gray-600"
                            : isWin
                              ? "bg-[rgb(238,11,22)] text-white"
                              : "bg-red-100 text-red-600"
                        }`}
                      >
                        {isDraw ? "DRAW" : isWin ? "WIN" : "LOSS"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-black truncate">
                          {b.problem?.title || "Unknown"}
                        </p>
                        <p className="text-xs text-black/50 font-semibold">
                          vs {opp?.user?.username || "Opponent"} ·{" "}
                          <span
                            className={
                              b.problem?.difficulty === "Easy"
                                ? "text-green-600"
                                : b.problem?.difficulty === "Medium"
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }
                          >
                            {b.problem?.difficulty}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`text-sm font-black border-2 border-black px-2 py-0.5 rounded-lg shadow-[2px_2px_0px_#000] ${change >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                      >
                        {change >= 0 ? "+" : ""}
                        {change} RP
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT column: Leaderboard */}
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
            <Trophy size={13} /> Leaderboard
          </h3>
          <div className="bg-white border-2 border-black shadow-[5px_5px_0px_#000] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#ffffff] border-b-2 border-black px-4 py-3">
              <p className="text-xs font-black text-black uppercase tracking-widest">
                Top Players
              </p>
            </div>

            {leaderboard.slice(0, 15).map((u, i) => {
              const rs = RANK_STYLES[u.rank] || RANK_STYLES.Novice;
              const isMe = u._id === user?._id;
              return (
                <div
                  key={u._id}
                  className={`flex items-center gap-3 px-4 py-3 border-b-2 border-black/10 last:border-0 transition-colors ${
                    isMe ? "bg-[#e0f8f8]" : "hover:bg-[#f8fefe]"
                  }`}
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-lg border-2 border-black text-xs font-black shadow-[2px_2px_0px_#000] ${
                      i === 0
                        ? "bg-amber-300 text-black"
                        : i === 1
                          ? "bg-gray-200 text-black"
                          : i === 2
                            ? "bg-amber-700/30 text-black"
                            : "bg-white text-black/40"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-black truncate ${isMe ? "text-[rgb(238,11,22)]" : "text-black"}`}
                    >
                      {u.username}
                      {isMe && (
                        <span className="text-xs font-bold ml-1 text-[rgb(238,11,22)]">
                          (you)
                        </span>
                      )}
                    </p>
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded border ${rs.bg} ${rs.text} ${rs.border}`}
                    >
                      {u.rank}
                    </span>
                  </div>
                  <span className="text-sm font-black text-black bg-[#f0fafa] border-2 border-black px-2 py-0.5 rounded-lg shadow-[2px_2px_0px_#000]">
                    {u.rating}
                  </span>
                </div>
              );
            })}
            {leaderboard.length === 0 && (
              <div className="text-center text-black/30 text-sm py-10 font-bold">
                No players yet
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "Battles", value: user?.totalBattles || 0 },
              { label: "Losses", value: user?.losses || 0 },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border-2 border-black shadow-[3px_3px_0px_#000] rounded-xl p-4 text-center"
              >
                <p className="text-2xl font-black text-black">{s.value}</p>
                <p className="text-xs font-bold text-black/40 uppercase tracking-wider mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
