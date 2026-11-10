export default function Logo({ size = "md" }) {
  const sizes = {
    sm: { icon: "w-7 h-7", text: "text-base", sub: "text-[8px]", gap: "gap-2" },
    md: { icon: "w-9 h-9", text: "text-xl", sub: "text-[9px]", gap: "gap-2.5" },
    lg: { icon: "w-12 h-12", text: "text-2xl", sub: "text-[10px]", gap: "gap-3" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${s.gap} select-none group cursor-pointer`}>
      {/* High-res Esports Emblem */}
      <div
        className={`${s.icon} relative rounded-xl border-2 border-black dark:border-zinc-700 bg-black overflow-hidden shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.1)] shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform`}
      >
        <img
          src="/codex_emblem.png"
          alt="CodeX Arena"
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            // Fallback to jpg or vector
            e.currentTarget.src = "/codex_emblem.jpg";
          }}
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight">
        <div className={`font-black tracking-tight leading-none ${s.text}`}>
          <span className="text-[rgb(238,11,22)]">CODEX</span>
          <span className="text-black dark:text-white transition-colors"> ARENA</span>
        </div>
        <span
          className={`font-mono font-extrabold tracking-[0.22em] text-black/40 dark:text-zinc-500 uppercase ${s.sub}`}
        >
          COMPETITIVE ARENA
        </span>
      </div>
    </div>
  );
}
