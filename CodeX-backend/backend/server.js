import mongoose from "mongoose";
import { server } from "./app.js";
import connectDB from "./config/database.js";
import { PORT, NODE_ENV } from "./config/constants.js";
import Problem from "./models/Problem.js";
import { PROBLEMS_SEED } from "./data/problems.seed.js";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const seedProblems = async () => {
  try {
    const count = await Problem.countDocuments({ isActive: true });
    if (count === 0) {
      console.log(`📚 Seeding ${PROBLEMS_SEED.length} problems...`);
      let created = 0;
      for (const prob of PROBLEMS_SEED) {
        const exists = await Problem.findOne({ slug: prob.slug });
        if (!exists) { await Problem.create(prob); created++; }
      }
      console.log(`✅ Seeded ${created} problems`);
    } else {
      console.log(`✅ ${count} problems in DB`);
    }
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  }
};

await connectDB();
await seedProblems();

server.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT} [${NODE_ENV}]`);
  console.log(`📡 Client: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err.name, err.message);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received — shutting down");
  server.close(() => { mongoose.connection.close(); });
});
