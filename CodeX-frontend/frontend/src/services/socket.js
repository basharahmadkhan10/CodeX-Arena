// src/services/socket.js
import { io } from "socket.io-client";

let socket = null;
let isConnecting = false;
let connectionPromise = null;
let heartbeatInterval = null;

export const connectSocket = (token) => {
  if (socket?.connected) {
    console.log("✅ Using existing socket connection");
    return Promise.resolve(socket);
  }
  
  if (isConnecting && connectionPromise) {
    console.log("⏳ Socket connection in progress...");
    return connectionPromise;
  }
  
  if (!token) {
    console.error("❌ No token provided for socket connection");
    return Promise.reject(new Error("No authentication token"));
  }
  
  isConnecting = true;
  
  connectionPromise = new Promise((resolve, reject) => {
    console.log("🔌 Creating socket with auth token...");
    
    socket = io("https://codex-arena-backend-90y5.onrender.com", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: { token },
      transportOptions: {
        polling: {
          extraHeaders: { 'Authorization': `Bearer ${token}` }
        }
      }
    });
    
    const timeout = setTimeout(() => {
      if (isConnecting) {
        console.error("❌ Socket connection timeout");
        isConnecting = false;
        reject(new Error("Connection timeout"));
      }
    }, 15000);
    
    socket.on("connect", () => {
      clearTimeout(timeout);
      console.log("✅ Socket connected, ID:", socket.id);
      isConnecting = false;
      
      // Start heartbeat
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => {
        if (socket?.connected) {
          socket.emit("ping");
        }
      }, 25000);
      
      resolve(socket);
    });
    
    socket.on("connect_error", (error) => {
      clearTimeout(timeout);
      console.error("❌ Socket error:", error.message);
      isConnecting = false;
      reject(error);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        setTimeout(() => {
          if (socket && !socket.connected && token) {
            console.log("🔄 Attempting to reconnect...");
            connectSocket(token).catch(console.error);
          }
        }, 1000);
      }
    });
    
    socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
    });
    
    socket.on("reconnect_failed", () => {
      console.error("❌ Socket reconnection failed");
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
    socket.disconnect();
    socket = null;
  }
  isConnecting = false;
  connectionPromise = null;
};

export const getSocket = () => socket;
