import { useEffect } from "react";
import { getSocket } from "../services/socket";
import useBattleStore from "../store/battleStore";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const useSocketEvents = () => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Rehydrate battle on page refresh (e.g. user hard-refreshes mid-battle)
    const state = useBattleStore.getState();
    if (!state.battle && state.queueStatus !== "searching") {
      useBattleStore.getState().fetchActiveBattle();
    }

    // ── Matchmaking ───────────────────────────────────────────────

    const onQueueSize = (size) => {
      useBattleStore.setState({ queueSize: size });
    };

    const onQueued = ({ position }) => {
      useBattleStore.setState({ queueStatus: "searching", queuePosition: position });
      // 5-minute client-side safety fallback
      setTimeout(() => {
        if (useBattleStore.getState().queueStatus === "searching") {
          useBattleStore.getState().leaveQueue();
          toast.error("No opponent found. Try again.");
        }
      }, 300_000);
    };

    const onMatchmakingError = ({ message }) => {
      useBattleStore.setState({ queueStatus: "idle" });
      toast.error(message || "Matchmaking failed. Try again.");
    };

    // ── Battle matched ────────────────────────────────────────────
    // The server emits "battle:matched" exactly ONCE per player.
    // We no longer listen to "battle:started" — that event was a
    // server-side duplicate that fired last with only {roomId, battleId},
    // wiping out battle.problem and causing a blank battle page.

    const onMatched = (data) => {
      console.log("⚔️ battle:matched received", data.roomId);

      useBattleStore.setState({
        queueStatus:          "matched",
        battle:               data,          // data already has the right shape from the server
        submissionResult:     null,
        opponentStatus:       null,
        opponentSubmitting:   false,
        opponentDisconnected: false,
        battleResult:         null,
      });

      const timeLimit = parseInt(data.timeLimit) || 1800;
      useBattleStore.getState().startTimer(timeLimit);
    };

    // ── During battle ─────────────────────────────────────────────

    const onSubmissionPending = () => {
      useBattleStore.setState({ isSubmitting: true });
    };

    const onSubmissionResult = (result) => {
      useBattleStore.setState({ isSubmitting: false, submissionResult: result });
    };

    const onOpponentSubmitting = () => {
      useBattleStore.setState({ opponentSubmitting: true });
      setTimeout(() => useBattleStore.setState({ opponentSubmitting: false }), 4000);
    };

    const onSubmissionUpdate = (data) => {
      const myId = useBattleStore.getState().battle?.you?.userId?.toString();
      if (data.userId?.toString() !== myId) {
        useBattleStore.setState({
          opponentStatus: {
            status: data.status,
            passed: data.passed,
            total:  data.total,
          },
          opponentSubmitting: false,
        });
      }
    };

    const onRunResult = (result) => {
      useBattleStore.setState({ runResult: result });
    };

    // ── Battle ended ──────────────────────────────────────────────

    const onBattleEnded = (result) => {
      useBattleStore.getState().stopTimer();
      useBattleStore.setState({
        battleResult:  result,
        isSubmitting:  false,
        queueStatus:   "idle",
      });

      const myId        = useAuthStore.getState().user?._id;
      const applyResult = useAuthStore.getState().applyBattleResult;
      if (applyResult) applyResult(result, myId);
    };

    const onOpponentDisconnected = () => {
      useBattleStore.setState({ opponentDisconnected: true });
    };

    const onOpponentReconnected = () => {
      useBattleStore.setState({ opponentDisconnected: false });
    };

    const onBattleError = ({ message }) => {
      useBattleStore.setState({ isSubmitting: false });
      toast.error(message || "Submission failed. Try again.");
    };

    // ── Reconnect: rejoin the battle room ─────────────────────────
    // After a socket reconnect the socket loses its room membership.
    // Re-emit battle:rejoin so the server re-adds us.
    const onReconnect = () => {
      const { battle } = useBattleStore.getState();
      if (battle?.roomId) {
        console.log("🔄 Rejoining battle room after reconnect:", battle.roomId);
        socket.emit("battle:rejoin", {
          roomId:   battle.roomId,
          battleId: battle.battleId,
        });
        toast("Reconnected to battle!", { icon: "🔄", duration: 2000 });
      }
    };

    // ── Register listeners ────────────────────────────────────────

    socket.on("matchmaking:queue_size",       onQueueSize);
    socket.on("matchmaking:queued",           onQueued);
    socket.on("matchmaking:error",            onMatchmakingError);
    socket.on("battle:matched",               onMatched);   // single source of truth
    socket.on("battle:submission_pending",    onSubmissionPending);
    socket.on("battle:submission_result",     onSubmissionResult);
    socket.on("battle:opponent_submitting",   onOpponentSubmitting);
    socket.on("battle:submission_update",     onSubmissionUpdate);
    socket.on("battle:run_result",            onRunResult);
    socket.on("battle:ended",                 onBattleEnded);
    socket.on("battle:opponent_disconnected", onOpponentDisconnected);
    socket.on("battle:opponent_reconnected",  onOpponentReconnected);
    socket.on("battle:error",                 onBattleError);
    socket.on("reconnect",                    onReconnect);

    return () => {
      socket.off("matchmaking:queue_size",       onQueueSize);
      socket.off("matchmaking:queued",           onQueued);
      socket.off("matchmaking:error",            onMatchmakingError);
      socket.off("battle:matched",               onMatched);
      socket.off("battle:submission_pending",    onSubmissionPending);
      socket.off("battle:submission_result",     onSubmissionResult);
      socket.off("battle:opponent_submitting",   onOpponentSubmitting);
      socket.off("battle:submission_update",     onSubmissionUpdate);
      socket.off("battle:run_result",            onRunResult);
      socket.off("battle:ended",                 onBattleEnded);
      socket.off("battle:opponent_disconnected", onOpponentDisconnected);
      socket.off("battle:opponent_reconnected",  onOpponentReconnected);
      socket.off("battle:error",                 onBattleError);
      socket.off("reconnect",                    onReconnect);
    };
  }, []);
};

export default useSocketEvents;
