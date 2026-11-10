import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Palette,
  Cpu,
  ShieldCheck,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import { getRankDetails } from "../utils/ranks";
import RankBadge from "./RankBadge";

const PRESET_AVATARS = [
  {
    id: "ninja",
    name: "Cyber Shinobi",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=ShadowCoder&backgroundColor=b6e3f4",
  },
  {
    id: "hacker",
    name: "Neon Hacker",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=CyberNinja&backgroundColor=c0aede",
  },
  {
    id: "valkyrie",
    name: "Valkyrie",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Valkyrie&backgroundColor=ffd5dc",
  },
  {
    id: "overlord",
    name: "Overlord AI",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=OverlordCore&backgroundColor=d1d4f9",
  },
  {
    id: "gladiator",
    name: "Pixel Gladiator",
    url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=ArenaWarrior&backgroundColor=ffdfbf",
  },
  {
    id: "titan",
    name: "Apex Titan",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=ApexTitanX&backgroundColor=c0aede",
  },
  {
    id: "samurai",
    name: "Neo Samurai",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=NeoSamurai&backgroundColor=b6e3f4",
  },
  {
    id: "sorcerer",
    name: "Code Sorcerer",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberVanguard&backgroundColor=ffd5dc",
  },
  {
    id: "ghost",
    name: "Ghost Dev",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=GhostDevX&backgroundColor=ffdfbf",
  },
  {
    id: "sentinel",
    name: "Iron Sentinel",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=IronSentinel&backgroundColor=b6e3f4",
  },
  {
    id: "ronin",
    name: "Cyber Ronin",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=CyberRoninX&backgroundColor=d1d4f9",
  },
  {
    id: "dragon",
    name: "Pixel Dragon",
    url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=PixelDragon&backgroundColor=ffd5dc",
  },
];

export default function SettingsModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'theme' | 'engine'

  // Profile form state
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Theme state
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setAvatar(user.avatar || "");
    }
    // Check initial dark mode from DOM
    const savedTheme = localStorage.getItem("codex_theme");
    setIsDark(savedTheme === "dark" || document.documentElement.classList.contains("dark"));
  }, [user, isOpen]);

  if (!isOpen) return null;

  const rankInfo = getRankDetails(user?.rating || 1000);

  const handleToggleTheme = (mode) => {
    const enableDark = mode === "dark";
    setIsDark(enableDark);
    if (enableDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("codex_theme", "dark");
      toast.success("Switched to Cyber Dark Mode 🌙");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("codex_theme", "light");
      toast.success("Switched to Classic Arena Mode ☀️");
    }
  };

  const handleSelectPreset = (url) => {
    setAvatar(url);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      toast.error("Username cannot be empty");
      return;
    }
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      toast.error("Username must be between 3 and 20 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      toast.error("Username can only contain letters, numbers, and underscores");
      return;
    }

    setIsSaving(true);
    const res = await updateProfile({
      username: cleanUsername,
      avatar: avatar.trim() || null,
    });
    setIsSaving(false);

    if (res.success) {
      toast.success("Profile updated successfully! ✨");
      onClose();
    } else {
      toast.error(res.message || "Failed to update profile");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 260 }}
          className="relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-950 border-4 border-black dark:border-zinc-800 rounded-3xl shadow-[10px_10px_0px_#000] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 dark:from-zinc-900 dark:via-red-950 dark:to-zinc-900 border-b-4 border-black dark:border-zinc-800 flex items-center justify-between text-white shadow-[0_4px_0px_#000]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/30 border-2 border-white/40 flex items-center justify-center text-xl shadow-inner">
                ⚙️
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">ARENA SETTINGS</h2>
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest font-mono">
                  Identity, Avatars & UI Themes
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-black/30 hover:bg-black/60 border-2 border-white/40 flex items-center justify-center transition-all shadow-[2px_2px_0px_#000]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b-2 border-black dark:border-zinc-800 bg-[#f8fefe] dark:bg-zinc-900/60 px-6 gap-2">
            {[
              { id: "profile", label: "Profile & Avatar", icon: User },
              { id: "theme", label: "Theme & UI", icon: Palette },
              { id: "engine", label: "Multi-Engine Specs", icon: Cpu },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-wider border-b-4 transition-all ${
                  activeTab === id
                    ? "border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-zinc-800/80 rounded-t-xl -mb-[2px]"
                    : "border-transparent text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto flex-1 text-black dark:text-white">
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* User Identity Preview Card */}
                <div className="bg-[#f0fafa] dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-2xl p-5 shadow-[4px_4px_0px_#000] flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl border-4 border-black dark:border-zinc-600 overflow-hidden bg-white shadow-[3px_3px_0px_#000] flex items-center justify-center">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username || "Player"}`;
                          }}
                        />
                      ) : (
                        <span className="text-3xl font-black text-black">
                          {username ? username.charAt(0).toUpperCase() : "P"}
                        </span>
                      )}
                    </div>
                    {/* Rank Badge Indicator */}
                    <RankBadge
                      rating={user?.rating || 1000}
                      size="xs"
                      showSub={true}
                      className="absolute -bottom-2 -right-2"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-black dark:text-white truncate">
                        {username || "Your Name"}
                      </span>
                      <span className="bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                        {rankInfo.tier}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-black/50 dark:text-zinc-400 mt-0.5 truncate">
                      {user?.email}
                    </p>
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                      <ShieldCheck size={13} /> {user?.authProvider === "google" ? "Google Account Connected" : "Email & Password Verified"}
                    </p>
                  </div>
                </div>

                {/* Username Input */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black/70 dark:text-zinc-300 mb-1.5 font-mono">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={20}
                      placeholder="Enter new username"
                      className="w-full px-4 py-3 rounded-xl border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold text-black dark:text-white shadow-[3px_3px_0px_#000] focus:outline-none focus:border-red-600 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-black/40 dark:text-zinc-500 font-mono">
                      {username.length}/20
                    </span>
                  </div>
                  <p className="text-[11px] text-black/50 dark:text-zinc-400 font-medium mt-1">
                    Letters, numbers, and underscores only (3-20 characters).
                  </p>
                </div>

                {/* Preset Avatars Grid */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black/70 dark:text-zinc-300 mb-2 flex items-center justify-between font-mono">
                    <span>Select Avatar</span>
                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                      12 Esports Avatars
                    </span>
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {PRESET_AVATARS.map((p) => {
                      const isSelected = avatar === p.url;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPreset(p.url)}
                          className={`relative aspect-square rounded-xl border-2 p-1 transition-all ${
                            isSelected
                              ? "border-red-600 bg-red-50 dark:bg-red-950/40 shadow-[4px_4px_0px_#ef4444] scale-105"
                              : "border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-[2px_2px_0px_#000] hover:scale-102"
                          }`}
                          title={p.name}
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-[10px] border border-black shadow">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-2 border-t-2 border-black/10 dark:border-zinc-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[rgb(238,11,22)] hover:bg-[rgb(218,8,20)] disabled:opacity-50 text-white font-black px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] uppercase tracking-wider text-sm transition-all"
                  >
                    {isSaving ? "Saving Changes..." : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "theme" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-black text-black dark:text-white">
                    Choose Arena Atmosphere
                  </h3>
                  <p className="text-xs font-medium text-black/60 dark:text-zinc-400 mt-0.5">
                    Select your preferred visual style for the arena dashboard and battle grounds.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Classic Arena Card */}
                  <div
                    onClick={() => handleToggleTheme("light")}
                    className={`cursor-pointer rounded-2xl border-4 p-5 transition-all ${
                      !isDark
                        ? "border-red-600 bg-red-50/50 shadow-[6px_6px_0px_#ef4444]"
                        : "border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_#000] hover:scale-101"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sun className="text-amber-500" size={20} />
                        <span className="font-black text-sm text-black dark:text-white">
                          Classic Arena
                        </span>
                      </div>
                      {!isDark && (
                        <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    {/* Miniature UI Preview */}
                    <div className="h-24 bg-[rgb(238,11,22)] rounded-xl border-2 border-black p-2.5 flex flex-col justify-between shadow-inner">
                      <div className="h-5 bg-white rounded border border-black px-2 flex items-center text-[9px] font-black text-black">
                        CODEX ARENA
                      </div>
                      <div className="flex gap-2">
                        <div className="h-10 flex-1 bg-white rounded border border-black p-1 text-[8px] font-bold text-black">
                          Stats
                        </div>
                        <div className="h-10 w-12 bg-white rounded border border-black flex items-center justify-center text-[10px]">
                          ⚔️
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-black/60 dark:text-zinc-400 mt-3">
                      High-contrast neo-brutalist esports red and crisp white layout.
                    </p>
                  </div>

                  {/* Cyber Void / Dark Mode Card */}
                  <div
                    onClick={() => handleToggleTheme("dark")}
                    className={`cursor-pointer rounded-2xl border-4 p-5 transition-all ${
                      isDark
                        ? "border-rose-500 bg-zinc-900 shadow-[6px_6px_0px_#f43f5e]"
                        : "border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_#000] hover:scale-101"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Moon className="text-rose-400" size={20} />
                        <span className="font-black text-sm text-black dark:text-white">
                          Cyber Void (Dark)
                        </span>
                      </div>
                      {isDark && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    {/* Miniature UI Preview */}
                    <div className="h-24 bg-[#090d16] rounded-xl border-2 border-zinc-700 p-2.5 flex flex-col justify-between shadow-inner">
                      <div className="h-5 bg-zinc-900 rounded border border-zinc-700 px-2 flex items-center text-[9px] font-black text-rose-400">
                        CODEX ARENA
                      </div>
                      <div className="flex gap-2">
                        <div className="h-10 flex-1 bg-zinc-900 rounded border border-zinc-700 p-1 text-[8px] font-bold text-zinc-300">
                          Stats
                        </div>
                        <div className="h-10 w-12 bg-zinc-900 rounded border border-rose-500/50 flex items-center justify-center text-[10px]">
                          ⚡
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-black/60 dark:text-zinc-400 mt-3">
                      OLED deep dark with crimson neon glowing accents. Easy on eyes in nocturnal coding duels.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-700 rounded-xl">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300 font-mono">
                    💡 Theme preference is saved locally on your device and automatically applies to all matches and pages.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "engine" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-black text-black dark:text-white">
                    Code Execution Pipeline & Integrity
                  </h3>
                  <p className="text-xs font-medium text-black/60 dark:text-zinc-400 mt-0.5">
                    Real-time status of compilers, sandboxes, and competitive fair play guards.
                  </p>
                </div>

                {/* Engine Feature Cards */}
                <div className="space-y-3">
                  <div className="p-4 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-xl shadow-[3px_3px_0px_#000] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center shrink-0 font-bold">
                      ⚡
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wider font-mono">
                          Local Safe Execution Sandbox
                        </h4>
                        <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400 font-mono">
                          ACTIVE (4s Watchdog)
                        </span>
                      </div>
                      <p className="text-xs text-black/70 dark:text-zinc-400 mt-1">
                        Runs JavaScript (Node.js), Python 3, and C/C++ natively with zero external cloud dependencies. Automatically engages if external APIs face rate limits.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-xl shadow-[3px_3px_0px_#000] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 flex items-center justify-center shrink-0 font-bold">
                      🛡️
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wider font-mono">
                          Anti-Cheat & Tab Integrity
                        </h4>
                        <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-400 font-mono">
                          ENFORCED
                        </span>
                      </div>
                      <p className="text-xs text-black/70 dark:text-zinc-400 mt-1">
                        Monitors browser tab blurs, copy/paste violations, and devtools access during ranked battles to ensure 100% fair duels.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-xl shadow-[3px_3px_0px_#000] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700 flex items-center justify-center shrink-0 font-bold">
                      📈
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wider font-mono">
                          Elo Rating Engine (0 - 5000 RP)
                        </h4>
                        <span className="text-[10px] font-black bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-400 font-mono">
                          CALIBRATED
                        </span>
                      </div>
                      <p className="text-xs text-black/70 dark:text-zinc-400 mt-1">
                        Dynamic K-factor adjustments: Bigger swings for streak winners, protection against large RP losses against higher-ranked opponents.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
