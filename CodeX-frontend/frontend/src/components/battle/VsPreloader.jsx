import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords } from "lucide-react";

export default function VsPreloader({ you, opponent, mode, onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(238,11,22)] overflow-hidden">
      {/* Dynamic Background Elements */}
      <motion.div
        className="absolute top-[-20%] left-[-10%] w-[50vw] h-[150vh] bg-black/20 origin-center"
        initial={{ rotate: 15, x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.div
        className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[150vh] bg-black/20 origin-center"
        initial={{ rotate: 15, x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      <div className="relative z-10 flex items-center justify-center gap-12 w-full max-w-5xl px-8">
        
        {/* Player 1 (You) */}
        <motion.div
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
          className="flex-1 flex flex-col items-end text-right"
        >
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[12px_12px_0px_rgba(0,0,0,0.5)] transform -rotate-3">
            <p className="text-sm font-black text-black/50 uppercase tracking-widest mb-1">Challenger</p>
            <h2 className="text-4xl font-black text-black break-words max-w-[250px] leading-tight">{you?.username || "You"}</h2>
            <div className="mt-3 inline-flex items-center gap-2 bg-[rgb(238,11,22)] text-white px-3 py-1.5 rounded-lg border-2 border-black font-black text-sm">
              <span>⭐ {you?.rating || 1000}</span>
            </div>
          </div>
        </motion.div>

        {/* VS Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.5 }}
          className="relative z-20 shrink-0"
        >
          <div className="w-32 h-32 bg-black rounded-full border-4 border-white flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <span className="text-5xl font-black text-white italic">VS</span>
            
            {/* Animated Swords inside VS */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center opacity-30"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
               <Swords size={96} strokeWidth={1} className="absolute text-white" />
            </motion.div>
          </div>
          
          <motion.div
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 1 }}
             className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-black font-black text-xs uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.5)]"
          >
             {mode === "debugging" ? "Debugging" : "1v1 Duel"}
          </motion.div>
        </motion.div>

        {/* Player 2 (Opponent) */}
        <motion.div
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
          className="flex-1 flex flex-col items-start text-left"
        >
          <div className="bg-black border-4 border-white rounded-3xl p-6 shadow-[12px_12px_0px_rgba(0,0,0,0.5)] transform rotate-3">
            <p className="text-sm font-black text-white/50 uppercase tracking-widest mb-1">Opponent</p>
            <h2 className="text-4xl font-black text-white break-words max-w-[250px] leading-tight">{opponent?.username || "Opponent"}</h2>
            <div className="mt-3 inline-flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-lg border-2 border-black font-black text-sm">
              <span>⭐ {opponent?.rating || 1000}</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
