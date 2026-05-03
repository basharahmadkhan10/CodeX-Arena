/** @format */

import mongoose from "mongoose";

const submissionResultSchema = new mongoose.Schema({
  passed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["AC", "WA", "TLE", "RE", "CE", "pending"],
    default: "pending",
  },
  executionTime: Number,
  errorMessage: String,
});

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  socketId: String,
  code: String,
  language: String,
  submittedAt: Date,
  result: submissionResultSchema,
  ratingChange: { type: Number, default: 0 },
  isConnected: { type: Boolean, default: true },
});

const battleSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true }, // unique already creates an index
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    participants: [participantSchema],
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "cancelled"],
      default: "active",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    endReason: {
      type: String,
      enum: ["solved", "timeout", "forfeit", "disconnect", null],
      default: null,
    },
    startedAt: Date,
    endedAt: Date,
    duration: Number, // seconds
    timeLimit: { type: Number, default: 1800 }, // 30 min in seconds
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// roomId is already indexed via unique:true above — no need to repeat it
battleSchema.index({ status: 1 }); // Battle.findOne({ status: "active" })
battleSchema.index({ status: 1, roomId: 1 }); // disconnecting handler compound lookup
battleSchema.index({ "participants.user": 1 }); // history: find all battles for a user
battleSchema.index({ createdAt: -1 }); // history pagination, newest first

export default mongoose.model("Battle", battleSchema);
