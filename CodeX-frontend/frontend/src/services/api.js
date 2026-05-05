// Update your api.js
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://codex-arena-backend-90y5.onrender.com/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dd_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem("dd_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
