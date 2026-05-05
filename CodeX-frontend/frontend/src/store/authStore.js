import { create } from "zustand";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

function nextRank(rating, currentRank) {
  if (rating >= 2200) return "Grandmaster";
  if (rating >= 1800) return "Master";
  if (rating >= 1500) return "Expert";
  if (rating >= 1200) return "Warrior";
  if (rating >= 1000) return "Apprentice";
  return currentRank || "Novice";
}

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  
  init: async () => {
    const token = localStorage.getItem("dd_token");
    if (!token) {
      set({ isInitialized: true, isLoading: false });
      return;
    }
    
    try {
      set({ isLoading: true });
      const { data } = await api.get("/auth/me");
      set({ user: data.user, isInitialized: true, isLoading: false });
      
      await connectSocket(token);
    } catch (err) {
      console.log("Auth failed:", err.response?.status);
      localStorage.removeItem("dd_token");
      set({ user: null, isInitialized: true, isLoading: false });
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/register", {
        username,
        email,
        password,
      });
      
      // Store token from response
      if (data.token) {
        localStorage.setItem("dd_token", data.token);
      }
      
      set({ user: data.user, isLoading: false });
      await connectSocket(data.token);
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed",
      };
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      
      // ✅ Store token from response body
      if (data.token) {
        localStorage.setItem("dd_token", data.token);
        console.log("✅ Token stored in localStorage");
      } else {
        console.warn("No token in response");
      }
      
      set({ user: data.user, isLoading: false });
      
      // Connect socket after login
      try {
        await connectSocket(data.token);
        console.log("✅ Socket connected");
      } catch (socketError) {
        console.warn("Socket connection failed:", socketError.message);
      }
      
      return { success: true };
    } catch (err) {
      console.error("Login error:", err.response?.data);
      set({ isLoading: false });
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  },

  googleLogin: async (credential) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/google", { credential });

      if (data.token) {
        localStorage.setItem("dd_token", data.token);
      }

      set({ user: data.user, isLoading: false });

      try {
        await connectSocket(data.token);
      } catch (socketError) {
        console.warn("Socket connection failed:", socketError.message);
      }

      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return {
        success: false,
        message: err.response?.data?.message || "Google sign-in failed",
      };
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.log("Logout error:", err.message);
    }
    
    localStorage.removeItem("dd_token");
    disconnectSocket();
    set({ user: null, isInitialized: false, isLoading: false });
    window.location.href = "/login";
  },

  updateUser: (updates) => set((s) => ({ 
    user: s.user ? { ...s.user, ...updates } : null 
  })),

  applyBattleResult: (result, myUserId) => {
    if (!result || !myUserId) return;

    const me = result.participants?.find((p) => p.userId === myUserId);
    if (!me) return;

    const currentUser = get().user;
    const ratingChange = me.ratingChange || 0;
    const isDraw = !result.winnerId;
    const isWin = result.winnerId === myUserId;

    set({
      user: currentUser
        ? {
            ...currentUser,
            rating: Math.max(0, (currentUser.rating || 1000) + ratingChange),
            totalBattles: (currentUser.totalBattles || 0) + 1,
            wins: (currentUser.wins || 0) + (isWin ? 1 : 0),
            losses: (currentUser.losses || 0) + (!isWin && !isDraw ? 1 : 0),
            draws: (currentUser.draws || 0) + (isDraw ? 1 : 0),
            rank: nextRank(
              Math.max(0, (currentUser.rating || 1000) + ratingChange),
              currentUser.rank,
            ),
          }
        : currentUser,
    });
  },
}));

export default useAuthStore;
