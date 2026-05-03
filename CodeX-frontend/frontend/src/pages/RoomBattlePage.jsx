import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Copy, Check, Users, Crown, LogOut, Play, Link } from "lucide-react";
import useBattleStore from "../store/battleStore";
import useAuthStore from "../store/authStore";
import { getSocket } from "../services/socket";

// ── Floating shapes (reuse from your other pages) ───────────────────────────
const floatingShapes = [
  { size: 64, top: "8%", left: "2%", rotate: 15, shape: "sq" },
  { size: 80, top: "10%", right: "3%", rotate: 30, shape: "sq" },
  { size: 52, bottom: "18%", left: "4%", rotate: 45, shape: "di" },
  { size: 72, bottom: "24%", right: "2%", rotate: 20, shape: "sq" },
  { size: 44, top: "45%", left: "1%", rotate: 10, shape: "di" },
  { size: 58, top: "52%", right: "4%", rotate: 35, shape: "sq" },
];

// ── Lobby Screen ─────────────────────────────────────────────────────────────
function LobbyScreen({ code, members, isHost, onStart, onLeave }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[rgb(238,11,22)] flex flex-col relative overflow-hidden">
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
          onClick={onLeave}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest border-2 border-black px-4 py-1.5 rounded-lg bg-white hover:bg-red-100 transition-all shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <LogOut size={13} /> Leave
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] rounded-2xl p-8 w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <span className="inline-block bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              Room Battle
            </span>
            <h2 className="text-3xl font-black text-black">
              {isHost ? "Your Room" : "Joined Room"}
            </h2>
            <p className="text-sm text-black/50 font-semibold mt-1">
              {isHost
                ? "Share the code — then start when ready"
                : "Waiting for host to start..."}
            </p>
          </div>

          {/* Room Code */}
          <div className="bg-[#f0fafa] border-2 border-black rounded-xl p-4 mb-5 shadow-[3px_3px_0px_#000]">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2 text-center">
              Room Code
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-black tracking-[0.25em] text-black">
                {code}
              </span>
              <button
                onClick={copyCode}
                className="p-2 border-2 border-black rounded-lg bg-white hover:bg-[rgb(238,11,22)] hover:text-white transition-all shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Members */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-black/50">
                Players
              </p>
              <span className="text-xs font-black bg-[#e0e0e0] border-2 border-black px-2 py-0.5 rounded-full">
                <Users size={10} className="inline mr-1" />
                {members.length} / 10
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              <AnimatePresence>
                {members.map((m) => (
                  <motion.div
                    key={m.userId}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="flex items-center justify-between bg-[#f8f8f8] border-2 border-black rounded-xl px-4 py-2.5 shadow-[2px_2px_0px_#000]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center text-sm font-black ${m.isHost ? "bg-[rgb(238,11,22)] text-white" : "bg-white"}`}
                      >
                        {m.username[0].toUpperCase()}
                      </div>
                      <span className="font-black text-sm text-black">
                        {m.username}
                      </span>
                    </div>
                    {m.isHost && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-yellow-300 border-2 border-black px-2 py-0.5 rounded-full">
                        <Crown size={10} /> Host
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions */}
          {isHost ? (
            <button
              onClick={onStart}
              disabled={members.length < 2}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[rgb(238,11,22)] text-white font-black text-sm uppercase tracking-widest border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Play size={15} />
              {members.length < 2 ? "Need 2+ players to start" : "Start Battle"}
            </button>
          ) : (
            <div className="text-center py-3 bg-[#f0fafa] border-2 border-black rounded-xl shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-4 h-4 border-2 border-black/20 border-t-[rgb(238,11,22)] rounded-full"
                />
                <span className="text-sm font-black text-black/50">
                  Waiting for host...
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ── Join/Create Screen ───────────────────────────────────────────────────────
function JoinCreateScreen({ onCreateRoom, onJoinRoom, onBack, error }) {
  const [tab, setTab] = useState("join"); // join | create
  const [inputCode, setInputCode] = useState("");

  const handleJoin = () => {
    if (inputCode.trim().length < 6) {
      toast.error("Enter a valid 6-character room code.");
      return;
    }
    onJoinRoom(inputCode.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen bg-[rgb(238,11,22)] flex flex-col relative overflow-hidden">
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

      <nav className="relative z-20 h-14 bg-white border-b-2 border-black flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-[rgb(238,11,22)] text-xl tracking-tight">
            CodeX
          </span>
          <span className="font-bold text-lg">Arena</span>
        </div>
        <button
          onClick={onBack}
          className="text-xs font-black uppercase tracking-widest border-2 border-black px-4 py-1.5 rounded-lg bg-white hover:bg-black hover:text-white transition-all shadow-[3px_3px_0px_#000]"
        >
          ← Back
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] rounded-2xl p-8 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <span className="inline-block bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              🔗 Room Battle
            </span>
            <h2 className="text-3xl font-black text-black">Friends Mode</h2>
            <p className="text-sm text-black/50 font-semibold mt-1">
              Create or join a private room
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-2 border-black rounded-xl overflow-hidden mb-6 shadow-[2px_2px_0px_#000]">
            {["join", "create"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${tab === t ? "bg-[rgb(238,11,22)] text-white" : "bg-white text-black/40 hover:text-black"}`}
              >
                {t === "join" ? "Join Room" : "Create Room"}
              </button>
            ))}
          </div>

          {tab === "join" ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-black/50 mb-2 block">
                  Enter Room Code
                </label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) =>
                    setInputCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full bg-[#f0fafa] border-2 border-black rounded-xl px-4 py-3 text-2xl font-black tracking-[0.3em] text-center text-black placeholder-black/20 focus:outline-none focus:border-[rgb(238,11,22)] shadow-[2px_2px_0px_#000]"
                />
              </div>
              {error && (
                <p className="text-xs font-black text-red-500 bg-red-50 border-2 border-red-300 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                onClick={handleJoin}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[rgb(238,11,22)] text-white font-black text-sm uppercase tracking-widest border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Link size={14} /> Join Room →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#f0fafa] border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_#000] text-sm text-black/60 font-semibold space-y-1.5">
                <p>✅ 2–10 players</p>
                <p>✅ Private room with a shareable code</p>
                <p>✅ You control when the battle starts</p>
                <p>✅ 45-minute battle timer</p>
              </div>
              {error && (
                <p className="text-xs font-black text-red-500 bg-red-50 border-2 border-red-300 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                onClick={onCreateRoom}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-black text-white font-black text-sm uppercase tracking-widest border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                🔗 Create Room →
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function RoomBattlePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    roomCode,
    roomMembers,
    roomStatus,
    isRoomHost,
    roomBattle,
    roomError,
    createRoom,
    joinRoom,
    startRoom,
    leaveRoom,
    resetRoom,
  } = useBattleStore();

  // Wire up socket listeners once
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("room:created", ({ code, members }) => {
      useBattleStore.setState({
        roomCode: code,
        roomMembers: members,
        roomStatus: "waiting",
        isRoomHost: true,
      });
    });

    socket.on("room:joined", ({ code, members, isHost }) => {
      useBattleStore.setState({
        roomCode: code,
        roomMembers: members,
        roomStatus: "waiting",
        isRoomHost: isHost,
      });
    });

    socket.on("room:member_joined", ({ members }) => {
      useBattleStore.setState({ roomMembers: members });
    });

    socket.on("room:member_left", ({ members }) => {
      useBattleStore.setState({ roomMembers: members });
    });

    socket.on("room:closed", ({ message }) => {
      toast.error(message || "Room was closed.");
      resetRoom();
    });

    socket.on("room:error", ({ message }) => {
      useBattleStore.setState({ roomError: message });
      toast.error(message);
    });

    socket.on("room:battle_started", (payload) => {
      useBattleStore.setState({ roomBattle: payload, roomStatus: "in_battle" });
      useBattleStore.getState().startTimer(payload.timeLimit);
    });

    socket.on("room:left", () => {
      resetRoom();
    });

    return () => {
      socket.off("room:created");
      socket.off("room:joined");
      socket.off("room:member_joined");
      socket.off("room:member_left");
      socket.off("room:closed");
      socket.off("room:error");
      socket.off("room:battle_started");
      socket.off("room:left");
    };
  }, []);

  // When battle starts → navigate to the battle page
  useEffect(() => {
    if (roomStatus === "in_battle" && roomBattle) {
      navigate("/battle/room/arena");
    }
  }, [roomStatus, roomBattle]);

  const handleLeave = () => {
    if (roomCode) leaveRoom(roomCode);
    else resetRoom();
    navigate("/battle");
  };

  // ── Lobby (waiting room) ──
  if (roomStatus === "waiting" && roomCode) {
    return (
      <LobbyScreen
        code={roomCode}
        members={roomMembers}
        isHost={isRoomHost}
        onStart={() => startRoom(roomCode)}
        onLeave={handleLeave}
      />
    );
  }

  // ── Join / Create screen ──
  return (
    <JoinCreateScreen
      onCreateRoom={createRoom}
      onJoinRoom={joinRoom}
      onBack={() => navigate("/battle")}
      error={roomError}
    />
  );
}
