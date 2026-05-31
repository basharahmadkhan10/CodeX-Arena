import mongoose from "mongoose";
import { server } from "./app.js";
import connectDB from "./config/database.js";
import { PORT, NODE_ENV } from "./config/constants.js";
import Problem from "./models/Problem.js";
import { PROBLEMS_SEED } from "./data/problems.seed.js";
import { DEBUGGING_PROBLEMS_SEED } from "./data/debugging.seed.js";
import { DEBUGGING_PROBLEMS_SEED as DEBUGGING_PROBLEMS_SEED_HARD } from "./data/debugging.seed.hard.js";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const seedProblems = async () => {
  try {
    const allSeeds = [...PROBLEMS_SEED, ...DEBUGGING_PROBLEMS_SEED, ...DEBUGGING_PROBLEMS_SEED_HARD];
    console.log(`Seeding ${allSeeds.length} problems if missing...`);

    const operations = allSeeds.map((problem) => ({
      updateOne: {
        filter: { slug: problem.slug },
        update: { $set: problem },
        upsert: true,
      },
    }));

    const result = await Problem.bulkWrite(operations, { ordered: false });
    console.log(`Seed sync complete. Inserted ${result.upsertedCount || 0} missing problems.`);
  } catch (err) {
    console.error("Seed error:", err.message);
  }
};

await connectDB();
await seedProblems();

server.listen(PORT, () => {
  console.log(`Server on port ${PORT} [${NODE_ENV}]`);
  console.log(`Client: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err.name, err.message);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received — shutting down");
  server.close(() => { mongoose.connection.close(); });
});
