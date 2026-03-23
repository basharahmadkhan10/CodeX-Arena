import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { CLIENT_URL } from "./config/constants.js";
import routes from "./routes/v1/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import socketHandler from "./sockets/index.js";
import MatchmakingService from "./service/matchmaking.service.js";

const app = express();
const server = http.createServer(app);

// Update CORS for both HTTP and Socket
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "https://codex-arena.onrender.com"],
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
  }),
);
app.use(compression());

// Update HTTP CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", routes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    socket: "running",
  });
});

MatchmakingService.setIO(io);
socketHandler(io);

app.use(errorMiddleware);

export { app, server };
