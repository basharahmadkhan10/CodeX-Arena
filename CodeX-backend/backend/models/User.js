/** @format */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    rating: { type: Number, default: 1000 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    totalBattles: { type: Number, default: 0 },
    rank: {
      type: String,
      enum: [
        "Novice",
        "Apprentice",
        "Warrior",
        "Expert",
        "Master",
        "Grandmaster",
      ],
      default: "Novice",
    },
    currentBattleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Battle",
      default: null,
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// username and email are already indexed via unique:true above
userSchema.index({ currentBattleId: 1 }); // matchmaking:join active battle check
userSchema.index({ rating: -1 }); // leaderboard sort

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateRank = function () {
  if (this.rating < 1200) this.rank = "Novice";
  else if (this.rating < 1400) this.rank = "Apprentice";
  else if (this.rating < 1600) this.rank = "Warrior";
  else if (this.rating < 1800) this.rank = "Expert";
  else if (this.rating < 2000) this.rank = "Master";
  else this.rank = "Grandmaster";
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);
