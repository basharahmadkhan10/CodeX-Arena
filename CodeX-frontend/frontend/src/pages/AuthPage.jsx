import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import Logo from "../components/Logo";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const googleButtonRef = useRef(null);
  const { login, register, verifyOtp, googleLogin, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }

        const existing = document.getElementById("google-gis-script");
        if (existing) {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", reject, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.id = "google-gis-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            const result = await googleLogin(response.credential);
            if (result.success) {
              toast.success(mode === "login" ? "Welcome back!" : "Account created!");
              navigate("/");
            } else {
              toast.error(result.message);
            }
          },
        });

        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 372,
        });
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Google sign-in could not be loaded");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, googleLogin, mode, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "login") {
      const result = await login(form.email, form.password);
      if (result.success) {
        toast.success("Welcome back!");
        navigate("/");
      } else toast.error(result.message);
    } else if (mode === "register") {
      const result = await register(form.username, form.email, form.password);
      if (result.success) {
        toast.success(result.message || "OTP sent! Check your email.");
        setMode("verify-otp");
      } else toast.error(result.message);
    } else if (mode === "verify-otp") {
      const result = await verifyOtp(form.email, otp);
      if (result.success) {
        toast.success("Account created successfully!");
        navigate("/");
      } else toast.error(result.message);
    }
  };

  const floatingShapes = [
    { size: 64, top: "10%", left: "3%", rotate: 15, bg: "#414141", shape: "sq" },
    {
      size: 80,
      top: "12%",
      right: "4%",
      rotate: 30,
      bg: "#414141",
      shape: "sq",
    },
    {
      size: 52,
      bottom: "20%",
      left: "5%",
      rotate: 45,
      bg: "#414141",
      shape: "di",
    },
    {
      size: 72,
      bottom: "26%",
      right: "3%",
      rotate: 20,
      bg: "#414141",
      shape: "sq",
    },
    {
      size: 44,
      top: "43%",
      left: "2%",
      rotate: 10,
      bg: "#414141",
      shape: "di",
    },
    {
      size: 58,
      top: "50%",
      right: "5%",
      rotate: 35,
      bg: "#414141",
      shape: "sq",
    },
    {
      size: 38,
      bottom: "8%",
      left: "15%",
      rotate: 55,
      bg: "#414141",
      shape: "di",
    },
    {
      size: 66,
      top: "80%",
      right: "12%",
      rotate: 25,
      bg: "#414141",
      shape: "sq",
    },
  ];

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
            background: s.bg,
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
      <nav className="relative z-20 h-14 bg-[#ffffff] border-b-2 border-black flex items-center px-6 shrink-0">
        <Logo size="md" />
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Hero */}
          <div className="text-center mb-8">
            <motion.h1
              className="text-5xl font-black text-black leading-none mb-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="inline-block bg-[#fefefe] px-3 py-1 border-2 border-black shadow-[5px_5px_0px_#000]">
                Compete
              </span>{" "}
              &amp;
              <br />
              <span className="inline-block mt-2 bg-[#ffffff] px-3 py-1 border-2 border-black shadow-[5px_5px_0px_#000]">
                Conquer
              </span>
            </motion.h1>
            <p className="text-[#fff] font-semibold mt-4 text-sm">
              Real-time 1v1 coding battles. Rank up. Prove your skills.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] rounded-2xl p-7">
            {/* Tabs */}
            {mode !== "verify-otp" && (
              <div className="flex bg-[#e0f8f8] border-2 border-black rounded-xl p-1 mb-6">
                {["login", "register"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${
                      mode === m
                        ? "bg-[rgb(238,11,22)] text-[#fff] border-2 border-black shadow-[3px_3px_0px_#000]"
                        : "text-black/40 hover:text-black"
                    }`}
                  >
                    {m === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === "verify-otp" ? (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="mb-4">
                      <p className="text-sm font-bold text-black/70 mb-4 text-center">
                        We sent a 6-digit code to <strong>{form.email}</strong>.
                      </p>
                      <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full bg-[#f0fafa] border-2 border-black rounded-lg px-4 py-3 text-center text-black placeholder-black/25 focus:outline-none focus:border-[rgb(238,11,22)] text-2xl tracking-[0.5em] font-mono shadow-[2px_2px_0px_#000] transition-all"
                        required
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <AnimatePresence mode="popLayout">
                      {mode === "register" && (
                        <motion.div
                          key="uname"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5">
                            Username
                          </label>
                          <input
                            type="text"
                            placeholder="your_handle"
                            value={form.username}
                            onChange={(e) =>
                              setForm({ ...form, username: e.target.value })
                            }
                            className="w-full bg-[#f0fafa] border-2 border-black rounded-lg px-4 py-2.5 text-black placeholder-black/25 focus:outline-none focus:border-[rgb(238,11,22)] text-sm font-mono shadow-[2px_2px_0px_#000] transition-all"
                            required={mode === "register"}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-[#f0fafa] border-2 border-black rounded-lg px-4 py-2.5 text-black placeholder-black focus:outline-none focus:border-[rgb(238,11,22)] text-sm shadow-[2px_2px_0px_#000] transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        className="w-full bg-[#f0fafa] border-2 border-black rounded-lg px-4 py-2.5 text-[#040404] placeholder-black focus:outline-none focus:border-[rgb(238,11,22)] text-sm shadow-[2px_2px_0px_#000] transition-all"
                        required
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[rgb(238,11,22)] hover:bg-[rgb(238,11,22)] active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 disabled:cursor-not-allowed text-[#fff] font-black py-3.5 rounded-xl border-2 border-black shadow-[5px_5px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all mt-1 uppercase tracking-widest text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating..."}
                  </span>
                ) : mode === "verify-otp" ? (
                  "Verify & Join →"
                ) : mode === "login" ? (
                  "Enter Arena →"
                ) : (
                  "Join Arena →"
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/20" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-black/45">
                or
              </span>
              <div className="h-px flex-1 bg-black/20" />
            </div>

            <div className="flex justify-center">
              <div ref={googleButtonRef} className="w-full flex justify-center overflow-hidden" />
            </div>

            {!googleClientId && (
              <p className="mt-3 text-center text-xs font-bold text-black/50">
                Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in the frontend env.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
