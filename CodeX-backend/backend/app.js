import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { CLIENT_URL } from "./config/constants.js";
import routes from "./routes/v1/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import socketHandler from "./sockets/index.js";
import MatchmakingService from "./service/matchmaking.service.js";

const app = express();
app.set('trust proxy', 1); 

const server = http.createServer(app);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: "Too many requests, please try again later." 
  },
  keyGenerator: (req) => {
    let ip = req.ip;
    if (ip && ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    return ip;
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes."
  }
});
const battleLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Rate limit exceeded. Please wait before submitting again."
  }
});

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173", "https://codex-arena.onrender.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
  })
);

app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173", "https://codex-arena.onrender.com"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" })); 
app.use(cookieParser());


app.use("/api/v1", globalLimiter);

app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

app.use("/api/v1/battles", (req, res, next) => {
  if (req.method === "POST" || req.method === "PUT") {
    return battleLimiter(req, res, next);
  }
  next();
});

app.use("/api/v1", routes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    socket: "running",
    rateLimiting: "active"
  });
});
MatchmakingService.setIO(io);
socketHandler(io);
app.use(errorMiddleware);

export { app, server };
