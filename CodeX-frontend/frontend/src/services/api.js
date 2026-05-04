
import axios from "axios";

const api = axios.create({
  baseURL: "https://codex-arena-backend-90y5.onrender.com/api/v1",
  withCredentials: true, 
});

api.interceptors.request.use((config) => {
  console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      axios.post('https://codex-arena-backend-90y5.onrender.com/api/v1/auth/logout', {}, {
        withCredentials: true
      }).catch(console.error);
      
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
