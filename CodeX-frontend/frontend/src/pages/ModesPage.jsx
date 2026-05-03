import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import useBattleStore from "../store/battleStore";

const modes = [
  {
    id: "1v1",
    title: "1v1 Battle",
    subtitle: "Duel Mode",
    description:
      "Go head-to-head against one random opponent. Solve the same problem faster and more accurately to claim victory.",
    icon: "⚔️",
    players: "2 Players",
    badge: "LIVE",
    available: true,
    route: "/battle/1v1",
    isPaid: false,
  },
  {
    id: "room",
    title: "Room Battle",
    subtitle: "Friends Mode",
    description:
      "Create a private room and share the code with friends. Battle your crew in a custom coding showdown.",
    icon: "🔗",
    players: "2–10 Players",
    badge: "LIVE", // ← was SOON
    available: true, // ← was false
    route: "/battle/room", // ← was null
    isPaid: false,
  },
  {
    id: "10v10",
    title: "10-Room Battle",
    subtitle: "Squad Mode",
    description:
      "Compete in a 10-player open room. Last coder standing wins. Fast rounds, brutal competition.",
    icon: "🏟️",
    players: "10 Players",
    badge: "SOON",
    available: false,
    route: null,
    isPaid: false,
  },
  {
    id: "tournament",
    title: "Tournament",
    subtitle: "50-Player Paid",
    description:
      "Enter the grand arena. 50 coders, one champion. Buy-in required. Prize pool distributed to top finishers.",
    icon: "🏆",
    players: "50 Players",
    badge: "PAID",
    available: false,
    route: null,
    isPaid: true,
  },
];

const floatingShapes = [
  { size: 64, top: "8%", left: "2%", rotate: 15, shape: "sq" },
  { size: 80, top: "10%", right: "3%", rotate: 30, shape: "sq" },
  { size: 52, bottom: "18%", left: "4%", rotate: 45, shape: "di" },
  { size: 72, bottom: "24%", right: "2%", rotate: 20, shape: "sq" },
  { size: 44, top: "45%", left: "1%", rotate: 10, shape: "di" },
  { size: 58, top: "52%", right: "4%", rotate: 35, shape: "sq" },
  { size: 38, bottom: "6%", left: "14%", rotate: 55, shape: "di" },
  { size: 66, top: "78%", right: "11%", rotate: 25, shape: "sq" },
];

export default function ModesPage() {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);
  const { joinQueue, resetRoom } = useBattleStore();

  const handleSelect = (mode) => {
    if (!mode.available) {
      toast("This mode is coming soon! Stay tuned. 🚀", {
        icon: "🔒",
        style: {
          background: "#fff",
          color: "#000",
          border: "2px solid #000",
          fontWeight: "700",
          boxShadow: "4px 4px 0px #000",
        },
      });
      return;
    }

    if (mode.id === "1v1") {
      joinQueue();
      navigate(mode.route);
      return;
    }

    if (mode.id === "room") {
      resetRoom(); // clear any stale room state before entering
      navigate(mode.route);
      return;
    }
  };

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
      <nav className="relative z-20 h-14 bg-white border-b-2 border-black flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-[rgb(238,11,22)] text-xl tracking-tight">
            CodeX
          </span>
          <span className="font-bold text-lg">Arena</span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-xs font-black uppercase tracking-widest border-2 border-black px-4 py-1.5 rounded-lg bg-white hover:bg-black hover:text-white transition-all shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Dashboard
        </button>
      </nav>

      {/* Header */}
      <div className="relative z-10 text-center pt-10 pb-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-block bg-white border-2 border-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_#000] mb-4">
            Choose Your Arena
          </span>
          <h1 className="text-5xl font-black text-black leading-none mb-3">
            <span className="inline-block bg-white px-3 py-1 border-2 border-black shadow-[5px_5px_0px_#000]">
              Select
            </span>{" "}
            <span className="text-white">a</span>
            <br />
            <span className="inline-block mt-2 bg-white px-3 py-1 border-2 border-black shadow-[5px_5px_0px_#000]">
              Battle Mode
            </span>
          </h1>
          <p className="text-white font-semibold text-sm mt-3">
            Pick your format. Enter the fight. Climb the ranks.
          </p>
        </motion.div>
      </div>

      {/* Mode Cards Grid */}
      <div className="relative z-10 flex-1 px-4 pb-12 pt-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
          {modes.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
              onHoverStart={() => setHoveredId(mode.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => handleSelect(mode)}
              className="relative cursor-pointer group"
            >
              <motion.div
                className={`bg-white border-2 border-black rounded-2xl p-6 ${
                  mode.available
                    ? "shadow-[6px_6px_0px_#000]"
                    : "shadow-[6px_6px_0px_#000] opacity-80"
                } transition-shadow duration-150`}
                animate={
                  hoveredId === mode.id && mode.available
                    ? { x: 3, y: 3 }
                    : { x: 0, y: 0 }
                }
              >
                {/* Red top strip for available */}
                {mode.available && (
                  <div className="absolute top-0 left-6 right-6 h-[3px] bg-[rgb(238,11,22)] rounded-full" />
                )}

                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-xl border-2 border-black flex items-center justify-center text-2xl shadow-[3px_3px_0px_#000] ${
                      mode.available ? "bg-[rgb(238,11,22)]" : "bg-[#e0e0e0]"
                    }`}
                  >
                    {mode.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-2 border-black ${
                        mode.badge === "LIVE"
                          ? "bg-[rgb(238,11,22)] text-white"
                          : mode.badge === "PAID"
                            ? "bg-black text-white"
                            : "bg-[#e0e0e0] text-black"
                      }`}
                    >
                      {mode.badge}
                    </span>
                    {mode.isPaid && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-2 border-black bg-yellow-300 text-black">
                        💰 Prize Pool
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/40">
                    {mode.subtitle}
                  </p>
                  <h2 className="text-2xl font-black text-black leading-tight">
                    {mode.title}
                  </h2>
                </div>

                {/* Description */}
                <p className="text-sm text-black/60 font-medium mb-5 leading-relaxed">
                  {mode.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black bg-[#f0fafa] border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_#000]">
                    👥 {mode.players}
                  </span>
                  <button
                    className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg border-2 border-black transition-all ${
                      mode.available
                        ? "bg-[rgb(238,11,22)] text-white shadow-[3px_3px_0px_#000] group-hover:shadow-[1px_1px_0px_#000] group-hover:translate-x-[2px] group-hover:translate-y-[2px]"
                        : "bg-[#e0e0e0] text-black/40 cursor-not-allowed shadow-[3px_3px_0px_#000]"
                    }`}
                  >
                    {mode.available ? "Enter →" : "Locked 🔒"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-white/70 text-xs font-semibold mt-8 tracking-wide"
        >
          More modes unlocking soon — stay sharp, keep grinding.
        </motion.p>
      </div>
    </div>
  );
}
