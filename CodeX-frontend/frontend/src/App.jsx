import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "./store/authStore";
import useSocketEvents from "./hooks/useSocketEvents";
import ErrorBoundary from "./components/ErrorBoundary";
import Logo from "./components/Logo";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/DashboardPage";
import BattlePage from "./pages/BattlePage";
import ModesPage from "./pages/ModesPage";
import RoomBattlePage from "./pages/RoomBattlePage";
import RoomArenaPage from "./pages/RoomArenaPage";

function SocketEventManager() {
  const { user, isInitialized } = useAuthStore();
  useSocketEvents();
  if (!isInitialized || !user) return null;
  return null;
}

const LOADING_MESSAGES = [
  "Sharpening blades...",
  "Loading the arena...",
  "Warming up the compilers...",
  "Summoning your opponent...",
  "Polishing trophies...",
];

function GamePreloader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 700);
    const progTimer = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 18, 95));
    }, 300);
    return () => {
      clearInterval(msgTimer);
      clearInterval(progTimer);
    };
  }, []);

  const floatingShapes = [
    { size: 56, top: "8%",    left:  "3%",   rotate: 15, shape: "sq" },
    { size: 72, top: "12%",   right: "4%",   rotate: 30, shape: "sq" },
    { size: 44, bottom: "20%",left:  "5%",   rotate: 45, shape: "di" },
    { size: 64, bottom: "22%",right: "3%",   rotate: 20, shape: "sq" },
    { size: 38, top:  "48%",  left:  "1.5%", rotate: 10, shape: "di" },
    { size: 52, top:  "55%",  right: "5%",   rotate: 35, shape: "sq" },
  ];

  return (
    <div className="min-h-screen bg-[rgb(238,11,22)] flex flex-col relative overflow-hidden">
      {floatingShapes.map((s, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            width: s.size, height: s.size,
            top: s.top, left: s.left, right: s.right, bottom: s.bottom,
            background: "#2a2a2a",
            borderRadius: s.shape === "di" ? "10px" : "14px",
            border: "2px solid rgba(0,0,0,0.15)",
            transform: `rotate(${s.rotate}deg)`,
            opacity: 0.55,
          }}
          animate={{ y: [0, -16, 0], rotate: [s.rotate, s.rotate + 12, s.rotate] }}
          transition={{ duration: 2.6 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
        />
      ))}

      <nav className="relative z-20 h-14 bg-white border-b-2 border-black flex items-center px-6 shrink-0">
        <Logo size="md" />
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="bg-white border-2 border-black shadow-[10px_10px_0px_#000] rounded-2xl p-10 text-center max-w-sm w-full"
        >
          {/* Sword icon animated */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-[3px] border-black/10 border-t-[rgb(238,11,22)] rounded-full absolute inset-0"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-[2px] border-black/10 border-b-[rgb(238,11,22)] rounded-full absolute inset-4"
            />
            <div className="w-24 h-24 flex items-center justify-center absolute inset-0">
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                  <path d="M24 4L6 22" stroke="rgb(238,11,22)" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M24 4L28 8L10 26L6 26L6 22L24 4Z" fill="rgb(238,11,22)" stroke="rgb(238,11,22)" strokeWidth="0.5" strokeLinejoin="round"/>
                  <path d="M3 29L6 26" stroke="rgb(238,11,22)" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M19 9L23 13" stroke="black" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
                </svg>
              </motion.div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-black mb-1 tracking-tight">CodeX Arena</h2>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/30 mb-6">
            Code · Compete · Conquer
          </p>

          {/* Progress bar */}
          <div className="w-full bg-black/10 border-2 border-black rounded-full h-3 mb-3 overflow-hidden shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]">
            <motion.div
              className="h-full bg-[rgb(238,11,22)] rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* Animated loading message */}
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-xs font-black text-black/40 uppercase tracking-widest"
            >
              {LOADING_MESSAGES[msgIndex]}
            </motion.p>
          </AnimatePresence>

          {/* Bouncing dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {[0, 150, 300].map((delay) => (
              <motion.span
                key={delay}
                className="inline-block w-2 h-2 bg-[rgb(238,11,22)] rounded-full border border-black"
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay: delay / 1000 }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 text-center text-white/50 text-xs font-bold tracking-widest pb-6"
      >
        ⚔️ The arena awaits
      </motion.p>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, isInitialized, isLoading } = useAuthStore();

  if (isLoading) return <GamePreloader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { init, isLoading, isInitialized } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (isLoading && !isInitialized) {
    return <GamePreloader />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <SocketEventManager />

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#fff",
              color: "#000",
              border: "2px solid #000",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              boxShadow: "3px 3px 0px #000",
            },
            success: { iconTheme: { primary: "rgb(238,11,22)", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#ef4444",       secondary: "#fff" } },
          }}
        />

        <Routes>
          <Route path="/login"              element={<AuthPage />} />
          <Route path="/"                   element={<RequireAuth><ModesPage /></RequireAuth>} />
          <Route path="/dashboard"          element={<RequireAuth><HomePage /></RequireAuth>} />
          <Route path="/battle/1v1"         element={<RequireAuth><BattlePage /></RequireAuth>} />
          <Route path="/battle/debugging"   element={<RequireAuth><BattlePage /></RequireAuth>} />
          <Route path="/battle/room"        element={<RequireAuth><RoomBattlePage /></RequireAuth>} />
          <Route path="/battle/room/arena"  element={<RequireAuth><RoomArenaPage /></RequireAuth>} />
          <Route path="*"                   element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
