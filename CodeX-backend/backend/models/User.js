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
      minlength: [6, "Password must be at least 6 characters"],
      default: null,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    rating: { type: Number, default: 1000 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    totalBattles: { type: Number, default: 0 },
    rank: {
      type: String,
      enum: [
        "Initiate I", "Initiate II", "Initiate III",
        "Striker I", "Striker II", "Striker III",
        "Gladiator I", "Gladiator II", "Gladiator III",
        "Warlord I", "Warlord II", "Warlord III",
        "Vanguard I", "Vanguard II", "Vanguard III",
        "Overlord I", "Overlord II", "Overlord III",
        "Sovereign",
        "Apex Immortal",
        "Novice", "Apprentice", "Warrior", "Expert", "Master", "Grandmaster"
      ],
      default: "Initiate I",
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

userSchema.index({ currentBattleId: 1 }); 
userSchema.index({ rating: -1 }); 

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateRank = function () {
  const r = this.rating;
  if (r < 300)       this.rank = "Initiate I";
  else if (r < 550)  this.rank = "Initiate II";
  else if (r < 800)  this.rank = "Initiate III";
  else if (r < 1050) this.rank = "Striker I";
  else if (r < 1300) this.rank = "Striker II";
  else if (r < 1500) this.rank = "Striker III";
  else if (r < 1750) this.rank = "Gladiator I";
  else if (r < 2000) this.rank = "Gladiator II";
  else if (r < 2200) this.rank = "Gladiator III";
  else if (r < 2450) this.rank = "Warlord I";
  else if (r < 2700) this.rank = "Warlord II";
  else if (r < 2900) this.rank = "Warlord III";
  else if (r < 3150) this.rank = "Vanguard I";
  else if (r < 3400) this.rank = "Vanguard II";
  else if (r < 3600) this.rank = "Vanguard III";
  else if (r < 3850) this.rank = "Overlord I";
  else if (r < 4100) this.rank = "Overlord II";
  else if (r < 4300) this.rank = "Overlord III";
  else if (r < 4900) this.rank = "Sovereign";
  else               this.rank = "Apex Immortal";
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);
