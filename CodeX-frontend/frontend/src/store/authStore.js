
import { create } from 'zustand';
import axios from 'axios';

axios.defaults.withCredentials = true;

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await axios.post('/api/v1/auth/login', { email, password });
      set({ user: res.data.user, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error.response?.data?.message };
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const res = await axios.post('/api/v1/auth/register', { username, email, password });
   
      
      set({ user: res.data.user, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error.response?.data?.message };
    }
  },

  logout: async () => {
    try {
      await axios.post('/api/v1/auth/logout', {}, { withCredentials: true });
      
      set({ user: null });
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get('/api/v1/auth/me', { withCredentials: true });
      set({ user: res.data.user, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ user: null, isLoading: false });
      return { success: false };
    }
  },

}));

export default useAuthStore;
