/** @format */

import { useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

/**
 * useAntiCheat — paste block + tab switch detection + fullscreen enforcement
 * @param {boolean} active — only runs during an active battle
 * @param {function} onViolation — called with (type, count) on each violation
 */
const useAntiCheat = (active, onViolation) => {
  const violationCount = useRef(0);
  const tabSwitchCount = useRef(0);

  // ── Block copy/paste/cut globally ─────────────────────────────────────────
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

  // ── Tab / window switch detection ─────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        violationCount.current += 1;
        onViolation?.("tab_switch", tabSwitchCount.current);

        // Progressive warnings
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
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [active, onViolation]);

  // ── Fullscreen enforcement ────────────────────────────────────────────────
  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
  }, []);

  const exitedFullscreen = useCallback(() => {
    return (
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.mozFullScreenElement
    );
  }, []);

  useEffect(() => {
    if (!active) return;

    // Request fullscreen when battle starts
    requestFullscreen();

    const handleFullscreenChange = () => {
      if (exitedFullscreen()) {
        violationCount.current += 1;
        onViolation?.("fullscreen_exit", violationCount.current);
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
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [active, requestFullscreen, exitedFullscreen, onViolation]);

  return {
    tabSwitchCount: tabSwitchCount.current,
    violationCount: violationCount.current,
    requestFullscreen,
  };
};

export default useAntiCheat;
