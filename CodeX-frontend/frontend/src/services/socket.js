import { io } from "socket.io-client";

let socket = null;
let isConnecting = false;
let connectionPromise = null;

export const connectSocket = () => {
  // If already connected, return existing socket
  if (socket?.connected) {
    console.log("✅ Using existing socket connection");
    return Promise.resolve(socket);
  }
  
  // If already connecting, return the existing promise
  if (isConnecting && connectionPromise) {
    console.log("⏳ Socket connection in progress, waiting...");
    return connectionPromise;
  }
  
  isConnecting = true;
  
  connectionPromise = new Promise((resolve, reject) => {
    console.log("🔌 Creating new socket connection...");
    
    socket = io("https://codex-arena-backend-90y5.onrender.com", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });
    
    // Set up event handlers
    socket.on("connect", () => {
      console.log("✅ Socket connected successfully. ID:", socket.id);
      isConnecting = false;
      resolve(socket);
    });
    
    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      isConnecting = false;
      reject(error);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect
        socket?.connect();
      }
    });
    
    // Set a timeout for connection
    setTimeout(() => {
      if (isConnecting) {
        isConnecting = false;
        reject(new Error("Socket connection timeout"));
      }
    }, 10000);
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

// For backward compatibility - returns a promise
export const initSocket = async () => {
  try {
    return await connectSocket();
  } catch (error) {
    console.error("Failed to initialize socket:", error);
    return null;
  }
};
