import { create } from "zustand";
import api from "../services/api";

const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,  

  init: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user, isLoading: false, isInitialized: true });
    } catch {
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },

  updateUser: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null
    }));
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/auth/login", { email, password });
      set({ user: res.data.user, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/auth/register", { username, email, password });
      set({ user: res.data.user, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error.response?.data?.message || "Registration failed" };
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
      set({ user: null });
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user, isLoading: false });
      return { success: true };
    } catch {
      set({ user: null, isLoading: false });
      return { success: false };
    }
  },
}));

export default useAuthStore;
