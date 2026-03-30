import { useEffect } from "react";
import { getSocket } from "../services/socket";
import useBattleStore from "../store/battleStore";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const useSocketEvents = () => {
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // ── Matchmaking ─────────────────────────────────────────────
    const onQueueSize = (size) => {
      useBattleStore.setState({ queueSize: size });
    };

    const onQueued = ({ position }) => {
      useBattleStore.setState({
        queueStatus: "searching",
        queuePosition: position,
      });
      setTimeout(() => {
        if (useBattleStore.getState().queueStatus === "searching") {
          useBattleStore.getState().leaveQueue();
          toast.error("No opponent found. Try again.");
        }
      }, 300000); // 5 min timeout
    };

    const onMatchmakingError = ({ message }) => {
      useBattleStore.setState({ queueStatus: "idle" });
      toast.error(message || "Matchmaking failed. Try again.");
    };

    // ── Battle matched ───────────────────────────────────────────
    const onMatched = (data) => {
      useBattleStore.setState({
        queueStatus: "matched",
        battle: data,
      });

      // Join the battle room
      socket.emit("battle:join_room", {
        roomId: data.roomId,
        battleId: data.battleId,
      });

      // Start countdown
      useBattleStore.getState().startTimer(data.timeLimit);
    };

    // ── During battle ────────────────────────────────────────────
    const onSubmissionResult = (result) => {
      useBattleStore.setState({ isSubmitting: false, submissionResult: result });
    };

    const onSubmissionPending = () => {
      useBattleStore.setState({ isSubmitting: true });
    };

    const onOpponentSubmitting = () => {
      useBattleStore.setState({ opponentSubmitting: true });
      setTimeout(() => useBattleStore.setState({ opponentSubmitting: false }), 4000);
    };

    const onSubmissionUpdate = (data) => {
      // This is opponent's result
      const battle = useBattleStore.getState().battle;
      if (data.userId !== battle?.you?.userId) {
        useBattleStore.setState({
          opponentStatus: { status: data.status, passed: data.passed, total: data.total },
          opponentSubmitting: false,
        });
      }
    };

    const onRunResult = (result) => {
      useBattleStore.setState({ runResult: result });
    };

    // ── Battle ended ─────────────────────────────────────────────
    const onBattleEnded = (result) => {
      useBattleStore.getState().stopTimer();
      useBattleStore.setState({
        battleResult: result,
        isSubmitting: false,
        queueStatus: "idle",
      });

      // Update user rating
      const myId = useAuthStore.getState().user?._id;
      const me = result.participants?.find((p) => p.userId === myId);
      if (me && me.ratingChange !== undefined) {
        const currentUser = useAuthStore.getState().user;
        updateUser({
          rating: (currentUser?.rating || 1000) + me.ratingChange,
          wins: currentUser?.wins + (result.winnerId === myId ? 1 : 0),
          losses:
            currentUser?.losses +
            (result.winnerId && result.winnerId !== myId ? 1 : 0),
        });
      }
    };

    const onOpponentDisconnected = () => {
      useBattleStore.setState({ opponentDisconnected: true });
    };

    const onBattleError = ({ message }) => {
      useBattleStore.setState({ isSubmitting: false });
      toast.error(message || "Submission failed. Try again.");
    };

    socket.on("matchmaking:queue_size", onQueueSize);
    socket.on("matchmaking:queued", onQueued);
    socket.on("matchmaking:error", onMatchmakingError);
    socket.on("battle:matched", onMatched);
    socket.on("battle:submission_pending", onSubmissionPending);
    socket.on("battle:submission_result", onSubmissionResult);
    socket.on("battle:opponent_submitting", onOpponentSubmitting);
    socket.on("battle:submission_update", onSubmissionUpdate);
    socket.on("battle:run_result", onRunResult);
    socket.on("battle:ended", onBattleEnded);
    socket.on("battle:opponent_disconnected", onOpponentDisconnected);
    socket.on("battle:error", onBattleError);

    return () => {
      socket.off("matchmaking:queue_size", onQueueSize);
      socket.off("matchmaking:queued", onQueued);
      socket.off("matchmaking:error", onMatchmakingError);
      socket.off("battle:matched", onMatched);
      socket.off("battle:submission_pending", onSubmissionPending);
      socket.off("battle:submission_result", onSubmissionResult);
      socket.off("battle:opponent_submitting", onOpponentSubmitting);
      socket.off("battle:submission_update", onSubmissionUpdate);
      socket.off("battle:run_result", onRunResult);
      socket.off("battle:ended", onBattleEnded);
      socket.off("battle:opponent_disconnected", onOpponentDisconnected);
      socket.off("battle:error", onBattleError);
    };
  }, []);
};

export default useSocketEvents;
