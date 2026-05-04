import { create } from "zustand";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

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
}));

export default useAuthStore;
