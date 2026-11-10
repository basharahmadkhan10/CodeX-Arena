import { useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";


const useAntiCheat = (active, onViolation) => {
  const violationCount = useRef(0);
  const tabSwitchCount = useRef(0);

  const onViolationRef = useRef(onViolation);
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  const notify = useCallback((type) => {
    violationCount.current += 1;
    if (typeof onViolationRef.current === "function") {
      onViolationRef.current(type, violationCount.current);
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    const block = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toast.error("Copy/paste is disabled during battles.", {
        id: "paste-block",
        duration: 2000,
      });
    };

    document.addEventListener("paste", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);

    return () => {
      document.removeEventListener("paste", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
    };
  }, [active]);

  // ── Tab / window switch detection ────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) return;

      tabSwitchCount.current += 1;
      notify("tab_switch");

      if (tabSwitchCount.current === 1) {
        toast("⚠️ Warning: Don't switch tabs during a battle!", {
          duration: 4000,
          style: {
            background: "#fff3cd",
            color: "#856404",
            border: "2px solid #856404",
            fontWeight: "700",
          },
        });
      } else if (tabSwitchCount.current === 2) {
        toast("⚠️ Final warning: Tab switching detected again!", {
          duration: 4000,
          style: {
            background: "#f8d7da",
            color: "#721c24",
            border: "2px solid #721c24",
            fontWeight: "700",
          },
        });
      } else {
        toast.error(`Tab switch #${tabSwitchCount.current} detected.`, {
          duration: 3000,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [active, notify]);

  // ── Fullscreen enforcement ────────────────────────────────────────────────
  const hasEnteredFullscreenRef = useRef(false);

  const requestFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
      hasEnteredFullscreenRef.current = true;
    } catch (err) {
      console.warn("[Fullscreen] Gesture required:", err.message);
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    const isFullscreen = () =>
      !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );

    if (isFullscreen()) {
      hasEnteredFullscreenRef.current = true;
    }

    const handleFullscreenChange = () => {
      if (isFullscreen()) {
        hasEnteredFullscreenRef.current = true;
        return;
      }

      // Only trigger violation if user had previously entered fullscreen and then exited
      if (hasEnteredFullscreenRef.current) {
        notify("fullscreen_exit");
        toast("🔲 Please stay in fullscreen during the battle.", {
          id: "fullscreen-warn",
          duration: 5000,
          style: {
            background: "#fff3cd",
            color: "#856404",
            border: "2px solid #856404",
            fontWeight: "700",
          },
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
    };
  }, [active, notify]);

  return { requestFullscreen };
};

export default useAntiCheat;
