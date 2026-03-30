import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET } from "../config/constants.js";

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1] ||
      socket.handshake.headers?.cookie
        ?.split("; ")
        .find((c) => c.startsWith("token="))
        ?.split("=")[1];

    if (!token) return next(new Error("No auth token"));

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next(new Error("User not found"));

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    socket.user = user;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
};

export default socketAuthMiddleware;
