import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  X,
  Lock,
  CheckCircle2,
  Flame,
  Zap,
} from "lucide-react";
import { RANKS_LADDER, getRankDetails } from "../utils/ranks";
import RankBadge from "./RankBadge";

export default function RankRoadDrawer({ isOpen, onClose, currentRating = 1000 }) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const rankInfo = getRankDetails(currentRating);

  if (!isOpen) return null;

  const filteredRanks = selectedFilter === "all"
    ? RANKS_LADDER
    : selectedFilter === "unlocked"
      ? RANKS_LADDER.filter((r) => currentRating >= r.minRp)
      : RANKS_LADDER.filter((r) => currentRating < r.minRp);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Drawer container */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative z-10 w-full max-w-xl h-full bg-[#ffffff] dark:bg-zinc-950 border-l-4 border-black dark:border-zinc-800 shadow-2xl flex flex-col text-black dark:text-white"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 dark:from-zinc-900 dark:via-red-950 dark:to-zinc-900 text-white border-b-4 border-black dark:border-zinc-800 flex items-center justify-between shrink-0 shadow-[0_4px_0px_#000]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-black/30 border-2 border-white/40 flex items-center justify-center text-2xl shadow-inner">
                <Trophy size={26} className="text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-300">
                    Competitive Ladder
                  </span>
                  <span className="bg-black/40 text-[10px] font-black px-2 py-0.5 rounded-full border border-white/20 font-mono">
                    0 - 5000 RP
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  TROPHY ROAD <Zap size={20} className="text-amber-300 fill-amber-300 animate-pulse" />
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-black/30 hover:bg-black/60 border-2 border-white/40 flex items-center justify-center transition-all shadow-[2px_2px_0px_#000]"
            >
              <X size={20} />
            </button>
          </div>

          {/* Current Rank Spotlight Card */}
          <div className="p-6 bg-[#f0fafa] dark:bg-zinc-900/80 border-b-4 border-black dark:border-zinc-800 shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-black/50 dark:text-zinc-400">
                  Your Current Standing
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <RankBadge rating={currentRating} size="lg" showSub={true} />
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-black dark:text-white">
                      {rankInfo.tier}
                    </h3>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 font-mono">
                      Division {rankInfo.major} • {rankInfo.minRp} - {rankInfo.maxRp} RP
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-black dark:text-white font-mono">
                  {currentRating}
                </span>
                <span className="text-xs font-bold text-black/50 dark:text-zinc-400 ml-1">RP</span>
                {rankInfo.nextRank && (
                  <p className="text-[11px] font-black text-red-600 dark:text-red-400 mt-1 font-mono">
                    +{rankInfo.rpNeeded} RP to {rankInfo.nextRank.tier}
                  </p>
                )}
              </div>
            </div>

            {/* Industrial Level Bar */}
            {rankInfo.nextRank ? (
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-black/60 dark:text-zinc-400 font-mono">
                  <span>Progression to {rankInfo.nextRank.tier}</span>
                  <span className="font-black text-red-600 dark:text-red-400">{rankInfo.progressPct}%</span>
                </div>
                <div className="w-full h-7 sm:h-8 bg-black/90 dark:bg-black rounded-lg border-2 border-black dark:border-zinc-700 overflow-hidden relative shadow-[3px_3px_0px_#000] p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rankInfo.progressPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded relative overflow-hidden"
                    style={{
                      backgroundColor: "#ee0b16",
                      backgroundImage:
                        "linear-gradient(135deg, rgba(255,255,255,0.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 75%, transparent 75%, transparent)",
                      backgroundSize: "14px 14px",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-3">
                    <span className="text-xs sm:text-sm font-black tracking-wider text-white drop-shadow-[0_2px_3px_rgba(0,0,0,1)] font-mono">
                      {rankInfo.progressPct}% COMPLETE · {currentRating} / {rankInfo.maxRp + 1} RP
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-amber-400/20 border-2 border-amber-500 rounded-xl text-center">
                <span className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest flex items-center justify-center gap-1.5 font-mono">
                  ⚡ HIGHEST RANK REACHED — GOD TIER APEX IMMORTAL ⚡
                </span>
              </div>
            )}

            {/* Filter pills */}
            <div className="flex items-center gap-2 mt-5">
              {[
                { id: "all", label: "All Tiers (20)" },
                { id: "unlocked", label: "Unlocked ✓" },
                { id: "locked", label: "Locked 🔒" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg border-2 border-black dark:border-zinc-700 text-xs font-black transition-all shadow-[2px_2px_0px_#000] ${
                    selectedFilter === f.id
                      ? "bg-red-600 text-white shadow-none translate-x-[1px] translate-y-[1px]"
                      : "bg-white dark:bg-zinc-800 text-black dark:text-zinc-300 hover:bg-black/5"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Rank Ladder List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredRanks.map((item, idx) => {
              const isCurrent = item.tier === rankInfo.tier;
              const isUnlocked = currentRating >= item.minRp;
              const isApex = item.minRp >= 4900;

              return (
                <motion.div
                  key={item.tier}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                  className={`relative rounded-2xl border-2 p-4 transition-all ${
                    isCurrent
                      ? "bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/40 border-amber-500 shadow-[5px_5px_0px_#f59e0b] ring-2 ring-amber-400/50"
                      : isUnlocked
                        ? "bg-white dark:bg-zinc-900/90 border-black dark:border-zinc-800 shadow-[4px_4px_0px_#000]"
                        : "bg-zinc-100/70 dark:bg-zinc-900/30 border-dashed border-zinc-300 dark:border-zinc-800 opacity-80"
                  }`}
                >
                  {/* Current rank ribbon */}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border-2 border-black shadow-[2px_2px_0px_#000] flex items-center gap-1 font-mono">
                      <Flame size={12} className="fill-black" /> Current Rank
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Rank Badge Component */}
                    <RankBadge
                      tier={item.tier}
                      rating={item.minRp}
                      size="lg"
                      showSub={true}
                    />

                    {/* Rank Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-lg font-black tracking-tight ${
                              isCurrent
                                ? "text-amber-600 dark:text-amber-400"
                                : isApex
                                  ? "text-rose-600 dark:text-rose-400 font-extrabold"
                                  : "text-black dark:text-white"
                            }`}
                          >
                            {item.tier}
                          </h4>
                          {isApex && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                              GOD TIER
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-black font-mono bg-black/5 dark:bg-zinc-800 border border-black/20 dark:border-zinc-700 px-2 py-0.5 rounded-lg shrink-0">
                          {item.minRp} - {item.maxRp} RP
                        </span>
                      </div>

                      {/* Lore / Superiority description */}
                      <p className="text-xs font-medium text-black/70 dark:text-zinc-300 mt-1.5 leading-relaxed">
                        {item.lore}
                      </p>

                      {/* Status row */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-black/10 dark:border-zinc-800/80">
                        <div className="flex items-center gap-1.5">
                          {isUnlocked ? (
                            <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={13} /> Unlocked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-black text-zinc-500 dark:text-zinc-500 font-mono">
                              <Lock size={12} /> Locked ({item.minRp - currentRating} RP needed)
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40 dark:text-zinc-500">
                          Division: {item.major}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 bg-white dark:bg-zinc-950 border-t-2 border-black dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-black/60 dark:text-zinc-400">
            <span>Win competitive duels to ascend the ladder</span>
            <button
              onClick={onClose}
              className="bg-black hover:bg-black/80 text-white dark:bg-white dark:text-black font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider border-2 border-black dark:border-white shadow-[2px_2px_0px_#000]"
            >
              Close Ladder
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
