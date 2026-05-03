import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Clock, Home } from "lucide-react";
import useAuthStore from "../../store/authStore";

const REASON_LABELS = {
  solved: "First to Solve",
  timeout: "Time Limit Reached",
  forfeit: "Opponent Forfeited",
  disconnect: "Opponent Disconnected",
};

export default function BattleResultModal({ result, you, onClose }) {
  const { user } = useAuthStore();
  if (!result) return null;

  const { winnerId, reason, duration, participants } = result;
  const me = participants?.find((p) => p.userId === you?.userId);
  const opponent = participants?.find((p) => p.userId !== you?.userId);
  const isWin = winnerId === you?.userId;
  const isDraw = !winnerId;

  const formatDuration = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.7, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 18, stiffness: 280 }}
        className="w-full max-w-md bg-white border-2 border-black shadow-[10px_10px_0px_#000] rounded-2xl overflow-hidden"
      >
        {/* Banner */}
        <div
          className={`py-8 px-6 text-center border-b-2 border-black ${
            isDraw
              ? "bg-gray-100"
              : isWin
                ? "bg-[rgb(238,11,22)]"
                : "bg-red-100"
          }`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 10 }}
          >
            {isDraw ? (
              <div className="text-5xl mb-3">🤝</div>
            ) : isWin ? (
              <div className="mb-3">
                <Trophy className="text-white mx-auto" size={52} />
              </div>
            ) : (
              <div className="text-5xl mb-3">💀</div>
            )}
            <h2
              className={`text-4xl font-black tracking-tight ${
                isWin ? "text-white" : "text-black"
              }`}
            >
              {isDraw ? "DRAW" : isWin ? "VICTORY!" : "DEFEATED"}
            </h2>
            <p
              className={`text-sm font-bold mt-1 uppercase tracking-widest ${
                isWin ? "text-white/80" : "text-black/50"
              }`}
            >
              {REASON_LABELS[reason] || reason}
            </p>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Rating change */}
          {me && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`flex items-center justify-between rounded-xl px-5 py-4 border-2 border-black shadow-[3px_3px_0px_#000] ${
                (me.ratingChange || 0) >= 0 ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <div className="flex items-center gap-2">
                {(me.ratingChange || 0) >= 0 ? (
                  <TrendingUp className="text-green-600" size={20} />
                ) : (
                  <TrendingDown className="text-red-500" size={20} />
                )}
                <span className="font-black text-black text-sm uppercase tracking-wider">
                  Rating Change
                </span>
              </div>
              <span
                className={`text-2xl font-black ${(me.ratingChange || 0) >= 0 ? "text-green-700" : "text-red-600"}`}
              >
                {(me.ratingChange || 0) >= 0 ? "+" : ""}
                {me.ratingChange || 0} RP
              </span>
            </motion.div>
          )}

          {/* Participant cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { p: me, label: "You", isMe: true },
              {
                p: opponent,
                label: opponent?.username || "Opponent",
                isMe: false,
              },
            ].map(({ p, label, isMe }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: isMe ? 0.3 : 0.4 }}
                className={`border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_#000] ${
                  isMe ? "bg-[#f0fafa]" : "bg-gray-50"
                }`}
              >
                <p
                  className={`text-xs font-black mb-2 uppercase tracking-wider ${
                    isMe ? "text-[rgb(238,11,22)]" : "text-black/40"
                  }`}
                >
                  {label}
                </p>
                <p className="text-sm font-black text-black mb-1">
                  {p?.result?.passed ?? 0}/{p?.result?.total ?? "?"} passed
                </p>
                <p
                  className={`text-xs font-black px-2 py-0.5 rounded-lg border border-black inline-block ${
                    p?.result?.status === "AC"
                      ? "bg-green-200 text-green-700"
                      : p?.result?.status === "WA"
                        ? "bg-red-200 text-red-600"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {p?.result?.status || "—"}
                </p>
                {p?.language && (
                  <p className="text-xs text-black/30 font-bold mt-1.5">
                    {p.language}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {duration && (
            <div className="flex items-center gap-2 text-sm text-black/40 font-bold">
              <Clock size={14} /> Duration: {formatDuration(duration)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-[rgb(238,11,22)] hover:bg-[rgb(218,8,20)] text-white font-black py-3.5 rounded-xl border-2 border-black shadow-[5px_5px_0px_#000] hover:shadow-[3px_3px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider"
          >
            <Home size={16} /> Back to Home
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
