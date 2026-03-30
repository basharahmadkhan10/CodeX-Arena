import { create } from "zustand";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,

  // ✅ Correct — isInitialized only after user is known
  init: async () => {
    try {
      const token = localStorage.getItem("dd_token");
      if (!token) {
        set({ user: null, isInitialized: true });
        return;
      }
      const { data } = await api.get("/auth/me"); // or whatever your verify endpoint is
      set({ user: data.user, token, isInitialized: true });
      connectSocket(token);
    } catch {
      localStorage.removeItem("dd_token"); // token expired/invalid, clean it up
      set({ user: null, token: null, isInitialized: true });
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
      localStorage.setItem("dd_token", data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      connectSocket(data.token);
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
      localStorage.setItem("dd_token", data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      connectSocket(data.token);
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
    } catch {}
    localStorage.removeItem("dd_token");
    disconnectSocket();
    set({ user: null, token: null, isInitialized: false });
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
}));

export default useAuthStore;
