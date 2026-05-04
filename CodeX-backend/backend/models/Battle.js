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

// New schema for room battle question results
const questionResultSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  status: { type: String, enum: ["AC", "WA", "RE", "CE", "pending"], default: "pending" },
  passed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  submittedAt: Date,
  code: String,
  language: String,
  errorMessage: String,
});

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  socketId: String,
  code: String, // For 1v1 compatibility
  language: String,
  submittedAt: Date,
  result: submissionResultSchema, // For 1v1 compatibility
  questionResults: [questionResultSchema], // NEW: For room battle with 4 questions
  ratingChange: { type: Number, default: 0 },
  isConnected: { type: Boolean, default: true },
  solvedCount: { type: Number, default: 0 }, // NEW: Track how many questions solved
});

const battleSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    // For 1v1 battle (single problem)
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
    },
    // For room battle (multiple problems)
    problems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
    }],
    // Flag to identify battle type
    isRoomBattle: { type: Boolean, default: false },
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
      enum: ["solved", "timeout", "forfeit", "disconnect", "all_solved", null],
      default: null,
    },
    startedAt: Date,
    endedAt: Date,
    duration: Number,
    timeLimit: { type: Number, default: 2700 }, // 45 min for room battle
  },
  { timestamps: true },
);

// Indexes
battleSchema.index({ status: 1 });
battleSchema.index({ status: 1, roomId: 1 });
battleSchema.index({ "participants.user": 1 });
battleSchema.index({ createdAt: -1 });

export default mongoose.model("Battle", battleSchema);
