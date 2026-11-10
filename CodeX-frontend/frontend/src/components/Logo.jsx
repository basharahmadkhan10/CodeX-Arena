export default function Logo({ size = "md" }) {
  const sizes = {
    sm: { icon: "w-5 h-5", text: "text-base", gap: "gap-1.5" },
    md: { icon: "w-7 h-7", text: "text-lg",   gap: "gap-2"   },
    lg: { icon: "w-9 h-9", text: "text-2xl",  gap: "gap-2.5" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${s.gap} select-none`}>
      <div
        className={`${s.icon} relative bg-[rgb(238,11,22)] border-2 border-black shadow-[2px_2px_0px_#000] rounded-lg flex items-center justify-center font-black text-white shrink-0`}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[65%] h-[65%]"
        >
          <path
            d="M15 2L3 14"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M15 2L18 5L6 17L3 17L3 14L15 2Z"
            fill="white"
            stroke="white"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          <path
            d="M1 19L3 17"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M12 5L15 8"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>
      <span className={`font-black tracking-tight leading-none ${s.text}`}>
        <span className="text-[rgb(238,11,22)]">CodeX</span>
        <span className="text-black dark:text-white transition-colors"> Arena</span>
      </span>
    </div>
  );
}
