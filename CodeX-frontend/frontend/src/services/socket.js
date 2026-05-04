import { io } from "socket.io-client";

let socket = null;
let isConnecting = false;
let connectionPromise = null;

export const connectSocket = (token) => {
  if (socket?.connected) {
    console.log("Using existing socket connection");
    return Promise.resolve(socket);
  }
  
  // If already connecting, wait
  if (isConnecting && connectionPromise) {
    console.log(" Socket connection in progress...");
    return connectionPromise;
  }
  
  if (!token) {
    console.error("No token provided for socket connection");
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
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      // Send token via auth (your backend expects this)
      auth: {
        token: token
      },
      // Also try headers
      transportOptions: {
        polling: {
          extraHeaders: {
            'Authorization': `Bearer ${token}`
          }
        }
      }
    });
    
    const timeout = setTimeout(() => {
      if (isConnecting) {
        console.error("❌ Socket connection timeout");
        isConnecting = false;
        reject(new Error("Connection timeout"));
      }
    }, 10000);
    
    socket.on("connect", () => {
      clearTimeout(timeout);
      console.log("✅ Socket connected, ID:", socket.id);
      isConnecting = false;
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
    });
  });
  
  return connectionPromise;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  isConnecting = false;
  connectionPromise = null;
};

export const getSocket = () => socket;
