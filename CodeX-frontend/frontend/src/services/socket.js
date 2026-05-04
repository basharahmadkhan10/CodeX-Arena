import { io } from "socket.io-client";

let socket = null;
let isConnecting = false;
let connectionPromise = null;

// Helper to get cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const connectSocket = () => {
  // If already connected, return existing socket
  if (socket?.connected) {
    console.log("✅ Using existing socket connection, ID:", socket.id);
    return Promise.resolve(socket);
  }
  
  // If already connecting, return the existing promise
  if (isConnecting && connectionPromise) {
    console.log("⏳ Socket connection in progress, waiting...");
    return connectionPromise;
  }
  
  isConnecting = true;
  
  connectionPromise = new Promise((resolve, reject) => {
    // Get the token from cookie
    const token = getCookie('token'); // Try 'token' first
    console.log("🔍 Token from cookie:", token ? `${token.substring(0, 20)}...` : "NOT FOUND");
    
    if (!token) {
      console.error("❌ No token found in cookies! Available cookies:", document.cookie);
      isConnecting = false;
      reject(new Error("No authentication token found"));
      return;
    }
    
    console.log("🔌 Creating new socket connection with auth token...");
    
    socket = io("https://codex-arena-backend-90y5.onrender.com", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      // ✅ Send token via auth (this is what your backend expects first)
      auth: {
        token: token
      },
      // Also try to send as header
      transportOptions: {
        polling: {
          extraHeaders: {
            'Authorization': `Bearer ${token}`
          }
        }
      }
    });
    
    let connectionTimeout = setTimeout(() => {
      if (isConnecting) {
        console.error("❌ Socket connection timeout");
        isConnecting = false;
        reject(new Error("Connection timeout"));
      }
    }, 10000);
    
    socket.on("connect", () => {
      clearTimeout(connectionTimeout);
      console.log("✅ Socket connected successfully. ID:", socket.id);
      isConnecting = false;
      resolve(socket);
    });
    
    socket.on("connect_error", (error) => {
      clearTimeout(connectionTimeout);
      console.error("❌ Socket connection error:", error.message);
      isConnecting = false;
      reject(error);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect
        setTimeout(() => {
          if (!socket?.connected) {
            console.log("🔄 Attempting to reconnect...");
            connectSocket().catch(console.error);
          }
        }, 1000);
      }
    });
  });
  
  return connectionPromise;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("🔌 Disconnecting socket...");
    socket.disconnect();
    socket = null;
  }
  isConnecting = false;
  connectionPromise = null;
};

export const getSocket = () => {
  if (!socket) {
    console.warn("⚠️ Socket not initialized. Call connectSocket() first.");
    return null;
  }
  return socket;
};

export const initSocket = async () => {
  try {
    return await connectSocket();
  } catch (error) {
    console.error("Failed to initialize socket:", error);
    return null;
  }
};
