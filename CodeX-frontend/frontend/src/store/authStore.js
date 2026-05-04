import { create } from "zustand";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  
  init: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get("/auth/me");
      set({ user: data.user, isInitialized: true, isLoading: false });
      connectSocket(); 
    } catch (err) {
      console.log("Not authenticated:", err.response?.status);
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
      set({ user: data.user, isLoading: false });
      connectSocket();
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
      set({ user: data.user, isLoading: false });
      connectSocket();
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.log("Logout error:", err);
    }
    disconnectSocket();
    set({ user: null, isInitialized: false });
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
}));

export default useAuthStore;
