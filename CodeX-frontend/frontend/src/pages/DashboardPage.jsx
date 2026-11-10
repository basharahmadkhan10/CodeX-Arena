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
  Settings,
  ChevronRight,
  Flame,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import useBattleStore from "../store/battleStore";
import api from "../services/api";
import Logo from "../components/Logo";
import RankBadge from "../components/RankBadge";
import RankRoadDrawer from "../components/RankRoadDrawer";
import SettingsModal from "../components/SettingsModal";
import { getRankDetails } from "../utils/ranks";

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { queueStatus, queueSize, joinQueue, leaveQueue, battle } =
    useBattleStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [isRankRoadOpen, setIsRankRoadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
      navigate("/modes");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const winRate = user?.totalBattles
    ? Math.round((user.wins / user.totalBattles) * 100)
    : 0;

  const rankInfo = getRankDetails(user?.rating || 1000);

  return (
    <div className="min-h-screen bg-[rgb(238,11,22)] dark:bg-[#090d16] transition-colors duration-200">
      {/* Navbar */}
      <nav className="h-16 bg-[#ffffff] dark:bg-zinc-950 border-b-2 border-black dark:border-zinc-800 flex items-center px-4 md:px-8 sticky top-0 z-40 transition-colors shadow-sm">
        <Logo size="md" />
        <div className="flex-1" />

        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Rank Badge / Trophy Road trigger */}
          <button
            onClick={() => setIsRankRoadOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.08)] hover:scale-102 transition-all group h-9"
            title="Open Trophy Road & Ranks"
          >
            <RankBadge rating={user?.rating || 1000} size="xs" showSub={false} />
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[11px] font-black uppercase text-black dark:text-white">
                  {rankInfo.tier}
                </span>
                <span className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1 rounded font-mono">
                  {user?.rating || 1000} RP
                </span>
              </div>
            </div>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 text-xs font-black text-black dark:text-white bg-white dark:bg-zinc-900 hover:bg-black/5 dark:hover:bg-zinc-800 px-3 py-2 rounded-xl transition-all border-2 border-black dark:border-zinc-700 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_rgba(255,255,255,0.08)]"
            title="Settings & Profile"
          >
            <Settings size={16} />
            <span className="hidden md:inline uppercase tracking-wider">Settings</span>
          </button>

          {/* User Avatar thumbnail */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-xl border-2 border-black dark:border-zinc-700 overflow-hidden bg-white shadow-[2px_2px_0px_#000] shrink-0"
            title="Edit Profile"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || "Player"}`;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-black text-sm bg-amber-200">
                {user?.username ? user.username.charAt(0).toUpperCase() : "P"}
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs font-black text-black dark:text-white hover:bg-black/10 dark:hover:bg-zinc-800 px-2.5 py-2 rounded-xl transition-colors border-2 border-black/20 dark:border-zinc-700"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT column (60% on desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Welcome + Hero Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-800 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.06)] rounded-2xl overflow-hidden transition-colors"
          >
            {/* Header strip */}
            <div className="bg-[#ffffff] dark:bg-zinc-900/90 border-b-2 border-black dark:border-zinc-800 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl border-2 border-black dark:border-zinc-700 overflow-hidden bg-[#f0fafa] dark:bg-zinc-800 shadow-[3px_3px_0px_#000] flex items-center justify-center">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || "Player"}`;
                        }}
                      />
                    ) : (
                      <span className="text-2xl font-black text-black dark:text-white">
                        {user?.username ? user.username.charAt(0).toUpperCase() : "P"}
                      </span>
                    )}
                  </div>
                  <RankBadge
                    rating={user?.rating || 1000}
                    size="xs"
                    showSub={true}
                    className="absolute -bottom-2 -right-2"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-black/60 dark:text-zinc-400 text-xs font-black uppercase tracking-widest">
                      Challenger
                    </p>
                    <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white">
                    {user?.username}
                    <span className="text-[rgb(238,11,22)]">.</span>
                  </h2>
                </div>
              </div>

              {/* Clickable Rank Badge */}
              <button
                onClick={() => setIsRankRoadOpen(true)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-black dark:border-zinc-700 bg-[#f0fafa] dark:bg-zinc-800 shadow-[3px_3px_0px_#000] hover:scale-102 transition-all text-left"
              >
                <RankBadge rating={user?.rating || 1000} size="md" showSub={true} />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                    {rankInfo.tier}
                  </p>
                  <p className="text-[11px] font-bold text-red-600 dark:text-red-400">
                    {user?.rating || 1000} RP
                  </p>
                </div>
                <ChevronRight size={16} className="text-black/40 dark:text-zinc-500 ml-1" />
              </button>
            </div>

            {/* Rank Lore & Professional Esports Level Bar */}
            <div className="px-6 py-4 bg-[#f8fefe] dark:bg-zinc-900/40 border-b-2 border-black/10 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <p className="text-xs font-bold text-black/70 dark:text-zinc-300 italic">
                  "{rankInfo.lore}"
                </p>
                {rankInfo.nextRank && (
                  <span className="text-xs font-black text-red-600 dark:text-red-400 shrink-0 font-mono">
                    +{rankInfo.rpNeeded} RP to {rankInfo.nextRank.tier}
                  </span>
                )}
              </div>

              {rankInfo.nextRank ? (
                <div className="space-y-1.5">
                  {/* Clean Esports Segmented Level Bar */}
                  <div className="w-full h-7 sm:h-8 bg-black/90 dark:bg-black rounded-lg border-2 border-black dark:border-zinc-700 overflow-hidden relative shadow-[3px_3px_0px_#000] dark:shadow-none p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rankInfo.progressPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded relative overflow-hidden transition-all duration-300"
                      style={{
                        backgroundColor: "#ee0b16",
                        backgroundImage:
                          "linear-gradient(135deg, rgba(255,255,255,0.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 75%, transparent 75%, transparent)",
                        backgroundSize: "14px 14px",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-3">
                      <span className="text-xs sm:text-sm font-black tracking-wider text-white drop-shadow-[0_2px_3px_rgba(0,0,0,1)] font-mono">
                        {rankInfo.progressPct}% COMPLETE · {user?.rating || 1000} / {rankInfo.maxRp + 1} RP
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-black/50 dark:text-zinc-400 font-mono">
                    <span>{rankInfo.minRp} RP FLOOR</span>
                    <span>NEXT: {rankInfo.nextRank.tier} (+{rankInfo.rpNeeded} RP)</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Flame size={13} /> HIGHEST RANK REACHED — GOD TIER APEX IMMORTAL
                </div>
              )}
            </div>

            <div className="px-6 py-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                {[
                  {
                    label: "Rating",
                    value: user?.rating || 1000,
                    icon: TrendingUp,
                    accent: "#eef2f2",
                  },
                  {
                    label: "Wins",
                    value: user?.wins || 0,
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
                    className="bg-[#f0fafa] dark:bg-zinc-800/80 border-2 border-black dark:border-zinc-700 rounded-xl p-3 sm:p-4 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_rgba(255,255,255,0.06)]"
                  >
                    <div className="w-8 h-8 rounded-lg border-2 border-black dark:border-zinc-700 flex items-center justify-center mb-2 shadow-[2px_2px_0px_#000] bg-white dark:bg-zinc-900">
                      <Icon size={16} className="text-black dark:text-white" />
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-black dark:text-white">
                      {value}
                    </p>
                    <p className="text-[11px] font-bold text-black/50 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Queue / Find Battle button */}
              <AnimatePresence mode="wait">
                {queueStatus === "searching" ? (
                  <motion.div
                    key="searching"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3 bg-[#e0f8f8] dark:bg-cyan-950/40 border-2 border-black dark:border-cyan-800 rounded-xl px-5 py-4 shadow-[3px_3px_0px_#000]">
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
                      <span className="text-black dark:text-white font-black text-sm uppercase tracking-wider">
                        Finding opponent...
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-xs font-bold text-black/50 dark:text-zinc-400 border border-black/20 dark:border-zinc-700 rounded-lg px-2 py-1">
                        <Users size={12} /> {queueSize} in queue
                      </span>
                    </div>
                    <button
                      onClick={handleQueue}
                      className="w-full py-3 rounded-xl border-2 border-black dark:border-zinc-700 text-black dark:text-white font-black text-sm uppercase tracking-widest bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shadow-[3px_3px_0px_#000]"
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
              <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-800 shadow-[4px_4px_0px_#000] rounded-xl p-8 text-center transition-colors">
                <p className="text-black/40 dark:text-zinc-500 text-sm font-bold">
                  No battles yet — enter the arena to test your skills!
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
                      className="flex items-center gap-4 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-800 shadow-[3px_3px_0px_#000] rounded-xl px-5 py-3.5 hover:bg-[#f0fafa] dark:hover:bg-zinc-800/80 transition-colors"
                    >
                      <div
                        className={`w-14 text-center py-1 rounded-lg border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_#000] ${
                          isDraw
                            ? "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400"
                            : isWin
                              ? "bg-[rgb(238,11,22)] text-white"
                              : "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isDraw ? "DRAW" : isWin ? "WIN" : "LOSS"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-black dark:text-white truncate">
                          {b.problem?.title || "Algorithmic Duel"}
                        </p>
                        <p className="text-xs text-black/50 dark:text-zinc-400 font-semibold">
                          vs {opp?.user?.username || "Opponent"} ·{" "}
                          <span
                            className={
                              b.problem?.difficulty === "Easy"
                                ? "text-green-600 dark:text-green-400"
                                : b.problem?.difficulty === "Medium"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-red-600 dark:text-red-400"
                            }
                          >
                            {b.problem?.difficulty || "Medium"}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`text-sm font-black border-2 border-black px-2.5 py-0.5 rounded-lg shadow-[2px_2px_0px_#000] ${
                          change >= 0
                            ? "bg-green-100 dark:bg-emerald-950 text-green-700 dark:text-emerald-400"
                            : "bg-red-100 dark:bg-rose-950 text-red-600 dark:text-rose-400"
                        }`}
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

        {/* RIGHT column: Leaderboard & Stats */}
        <div className="lg:col-span-5 space-y-6">
          {/* Leaderboard Card */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Trophy size={15} className="text-amber-300" /> Leaderboard
              </h3>
              <button
                onClick={() => setIsRankRoadOpen(true)}
                className="text-xs font-black text-white/90 hover:text-white uppercase tracking-wider underline underline-offset-4 flex items-center gap-1 group"
              >
                Trophy Road <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-800 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.06)] rounded-2xl overflow-hidden transition-colors">
              {/* Header */}
              <div className="bg-[#ffffff] dark:bg-zinc-900/90 border-b-2 border-black dark:border-zinc-800 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                    Top Arena Champions
                  </p>
                  <p className="text-[11px] font-bold text-black/50 dark:text-zinc-400">
                    Ranked by Competitive Elo (0 - 5000 RP)
                  </p>
                </div>
                <span className="text-xs font-black text-black/60 dark:text-zinc-400 font-mono border-2 border-black/20 dark:border-zinc-700 rounded-lg px-2.5 py-1 bg-black/5 dark:bg-zinc-800">
                  GLOBAL
                </span>
              </div>

              <div className="divide-y-2 divide-black/10 dark:divide-zinc-800/80 max-h-[560px] overflow-y-auto">
                {leaderboard.slice(0, 20).map((u, i) => {
                  const uRank = getRankDetails(u.rating);
                  const isMe = u._id === user?._id;
                  return (
                    <div
                      key={u._id}
                      className={`flex items-center gap-3.5 px-5 py-3.5 transition-colors ${
                        isMe
                          ? "bg-[#e0f8f8] dark:bg-cyan-950/40"
                          : "hover:bg-[#f8fefe] dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      {/* Position Badge */}
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-xl border-2 border-black text-xs font-black shadow-[2px_2px_0px_#000] shrink-0 font-mono ${
                          i === 0
                            ? "bg-amber-300 text-black shadow-amber-400"
                            : i === 1
                              ? "bg-slate-200 text-black"
                              : i === 2
                                ? "bg-amber-700/40 text-black"
                                : "bg-white dark:bg-zinc-800 text-black/60 dark:text-zinc-300"
                        }`}
                      >
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>

                      {/* Rank Crest Emblem */}
                      <RankBadge rating={u.rating} size="sm" showSub={true} />

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-sm sm:text-base font-black truncate ${
                              isMe
                                ? "text-[rgb(238,11,22)] dark:text-rose-400"
                                : "text-black dark:text-white"
                            }`}
                          >
                            {u.username}
                          </p>
                          {isMe && (
                            <span className="text-[10px] font-black uppercase bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.2 rounded border border-red-300 dark:border-red-800 font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-black/50 dark:text-zinc-400 truncate">
                          {uRank.tier} • {u.wins || 0} Wins
                        </p>
                      </div>

                      {/* Rating RP Pill */}
                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-black text-black dark:text-white bg-[#f0fafa] dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 px-3 py-1 rounded-xl shadow-[2px_2px_0px_#000] inline-block font-mono">
                          {u.rating} RP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {leaderboard.length === 0 && (
                <div className="text-center text-black/30 dark:text-zinc-600 text-sm py-12 font-bold font-mono">
                  No ranked players yet
                </div>
              )}
            </div>

            {/* Quick stats grid */}
            <div className="mt-5 grid grid-cols-2 gap-3.5">
              {[
                { label: "Total Battles", value: user?.totalBattles || 0 },
                { label: "Losses", value: user?.losses || 0 },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-800 shadow-[3px_3px_0px_#000] rounded-xl p-4 text-center transition-colors"
                >
                  <p className="text-2xl font-black text-black dark:text-white font-mono">{s.value}</p>
                  <p className="text-xs font-bold text-black/40 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trophy Road Drawer */}
      <RankRoadDrawer
        isOpen={isRankRoadOpen}
        onClose={() => setIsRankRoadOpen(false)}
        currentRating={user?.rating || 1000}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
