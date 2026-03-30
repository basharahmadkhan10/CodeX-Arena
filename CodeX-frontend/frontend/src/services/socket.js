import { io } from "socket.io-client";

let socket = null;
let isConnecting = false;

export const connectSocket = (token) => {
  if (!token) {
    console.warn("connectSocket called without token — skipping");
    return null;
  }

  // Already connected with a live socket
  if (socket?.connected) return socket;

  // Prevent concurrent connect calls
  if (isConnecting) return socket;

  // Clean up dead socket
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  isConnecting = true;

  socket = io("http://localhost:5000", {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    withCredentials: true,
    forceNew: true, 
  });

  socket.on("connect", () => {
    isConnecting = false;
    console.log("🔌 Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    isConnecting = false;
    console.log("🔌 Socket disconnected:", reason);
    if (reason === "io server disconnect") {
      socket.removeAllListeners();
      socket = null;
    }
  });

  socket.on("connect_error", (err) => {
    isConnecting = false;
    console.error("Socket error:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  isConnecting = false;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
