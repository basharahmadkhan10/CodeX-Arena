import { io } from "socket.io-client";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const socketUrl = baseUrl.replace(/\/api\/v1$/, "");

let socket = null;
let isConnecting = false;
let connectionPromise = null;
let heartbeatInterval = null;
let currentToken = null;

export const connectSocket = (token) => {

  if (socket?.connected) {
    console.log("Using existing socket connection");
    return Promise.resolve(socket);
  }

  if (isConnecting && connectionPromise) {
    console.log("⏳ Socket connection in progress...");
    return connectionPromise;
  }

  if (!token) {
    console.error("No token provided for socket connection");
    return Promise.reject(new Error("No authentication token"));
  }

  if (socket && !socket.connected) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = token;
  isConnecting = true;

  connectionPromise = new Promise((resolve, reject) => {
    console.log("🔌 Creating socket with auth token...");

    socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      timeout: 20000,
      auth: { token },
      transportOptions: {
        polling: {
          extraHeaders: { Authorization: `Bearer ${token}` },
        },
      },
    });

    const timeout = setTimeout(() => {
      if (isConnecting) {
        console.error("❌ Socket connection timeout");
        isConnecting = false;
        connectionPromise = null;
        reject(new Error("Connection timeout"));
      }
    }, 20000);

    socket.on("connect", () => {
      clearTimeout(timeout);
      console.log("✅ Socket connected, ID:", socket.id);
      isConnecting = false;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => {
        if (socket?.connected) socket.emit("ping");
      }, 25000);

      resolve(socket);
    });

    socket.on("connect_error", (error) => {
      clearTimeout(timeout);
      console.error("❌ Socket connect_error:", error.message);
      // Only reject on the very first connection attempt
      if (isConnecting) {
        isConnecting = false;
        connectionPromise = null;
        reject(error);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }

      // "io server disconnect" = server kicked us intentionally.
      // socket.io will NOT auto-reconnect in this case, so we manually reconnect.
      // BUT: we must NOT call connectSocket() again — that creates a second socket.
      // Instead, just call socket.connect() on the existing instance.
      if (reason === "io server disconnect") {
        console.log("🔄 Server disconnected us — reconnecting existing socket...");
        setTimeout(() => {
          if (socket && !socket.connected) {
            socket.auth = { token: currentToken };
            socket.connect(); // reconnect same socket instance
          }
        }, 1000);
      }
      // For all other reasons (transport close, timeout, etc.)
      // socket.io's built-in reconnection handles it automatically.
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      // Restart heartbeat after reconnect
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => {
        if (socket?.connected) socket.emit("ping");
      }, 25000);
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ Socket reconnection failed after all attempts");
      connectionPromise = null;
    });
  });

  return connectionPromise;
};

export const disconnectSocket = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  isConnecting = false;
  connectionPromise = null;
  currentToken = null;
};

export const getSocket = () => socket;
