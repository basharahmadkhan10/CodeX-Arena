import axios from "axios";

const api = axios.create({
  baseURL: "https://codex-arena-backend-90y5.onrender.com/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dd_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("dd_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
