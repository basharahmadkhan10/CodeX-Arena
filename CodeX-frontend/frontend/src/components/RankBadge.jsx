import React from "react";
import { getRankDetails } from "../utils/ranks";

const SIZES = {
  xs: {
    container: "w-6 h-6",
    img: "w-5 h-5",
    badgeText: "text-[8px] px-1",
  },
  sm: {
    container: "w-8 h-8",
    img: "w-7 h-7",
    badgeText: "text-[9px] px-1",
  },
  md: {
    container: "w-11 h-11",
    img: "w-10 h-10",
    badgeText: "text-[10px] px-1.5",
  },
  lg: {
    container: "w-16 h-16",
    img: "w-14 h-14",
    badgeText: "text-[11px] px-2",
  },
  xl: {
    container: "w-24 h-24",
    img: "w-20 h-20",
    badgeText: "text-xs px-2.5",
  },
};

export default function RankBadge({
  rating,
  tier,
  size = "md",
  showSub = true,
  className = "",
}) {
  const rank = tier
    ? getRankDetails().tier === tier
      ? getRankDetails()
      : getRankDetails(rating || 1000)
    : getRankDetails(rating || 1000);

  const s = SIZES[size] || SIZES.md;
  const isApex = rank.isApex || rank.major === "Apex Immortal";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${s.container} ${className}`}
      title={`${rank.tier} (${rank.minRp} - ${rank.maxRp} RP)`}
    >
      {/* Glow for high tiers */}
      {(rank.major === "Sovereign" || isApex) && (
        <div
          className={`absolute inset-0 rounded-full blur-md opacity-50 ${
            isApex ? "bg-amber-400 animate-pulse" : "bg-rose-500"
          }`}
        />
      )}

      {/* Emblem Image Container */}
      <div
        className="w-full h-full rounded-xl bg-black/90 dark:bg-black border-2 border-black dark:border-zinc-700 flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.08)] relative z-10"
        style={{
          boxShadow: isApex
            ? "0 0 12px rgba(251, 191, 36, 0.6), 2px 2px 0px #000"
            : undefined,
        }}
      >
        <img
          src={rank.emblem}
          alt={rank.tier}
          className={`${s.img} object-contain transition-transform hover:scale-110 duration-200`}
          onError={(e) => {
            // Fallback to high-contrast SVG insignia if image fails
            e.currentTarget.style.display = "none";
          }}
        />

        {/* Vector fallback if image hasn't loaded */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 text-white font-black text-xs">
          {rank.major.charAt(0)}
        </div>
      </div>

      {/* Sub-tier Pip (I, II, III, APEX, LEGEND) */}
      {showSub && (
        <span
          className={`absolute -bottom-1 -right-1 z-20 font-black rounded-md border border-black shadow-[1px_1px_0px_#000] leading-none uppercase tracking-tighter ${s.badgeText}`}
          style={{
            backgroundColor: rank.badgeColor || "#000",
            color: "#000",
          }}
        >
          {rank.sub}
        </span>
      )}
    </div>
  );
}
