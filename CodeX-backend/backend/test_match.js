import mongoose from "mongoose";
import dotenv from "dotenv";
import MatchmakingService from "./service/matchmaking.service.js";
import connectDB from "./config/database.js";
import User from "./models/User.js";

dotenv.config();

async function run() {
  await connectDB();
  
  // Find two users
  const users = await User.find().limit(2);
  if (users.length < 2) {
    console.log("Need at least 2 users");
    process.exit(0);
  }

  const p1 = { userId: users[0]._id.toString(), socketId: "s1", username: users[0].username, rating: 1000 };
  const p2 = { userId: users[1]._id.toString(), socketId: "s2", username: users[1].username, rating: 1000 };

  // mock io
  MatchmakingService.setIO({
    sockets: { sockets: { get: () => ({ join: () => {}, connected: true, emit: console.log }) } },
    to: () => ({ emit: (ev, data) => console.log("Emit", ev, "to room") })
  });

  console.log("Testing _createBattle...");
  try {
    await MatchmakingService._createBattle(p1, p2, "standard");
    console.log("Success!");
  } catch (err) {
    console.error("FAILED:", err);
  }
  
  process.exit(0);
}

run();
