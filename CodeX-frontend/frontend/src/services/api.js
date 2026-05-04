import axios from "axios";

const api = axios.create({
  baseURL: "https://codex-arena-backend-90y5.onrender.com/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  console.log(` ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const isAuthEndpoint = originalRequest.url?.includes('/auth/');
      
      if (!isAuthEndpoint && !window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(err);
  }
);

export default api;
