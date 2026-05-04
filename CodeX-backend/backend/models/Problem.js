

import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: "" },
  output: { type: String, required: true },
  isPublic: { type: Boolean, default: false }, 
});

const exampleSchema = new mongoose.Schema({
  input: String,
  output: String,
  explanation: String,
});

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, 
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    tags: [String],
    constraints: String,
    examples: [exampleSchema],
    testCases: [testCaseSchema],
    timeLimit: { type: Number, default: 2000 }, 
    memoryLimit: { type: Number, default: 256 }, 
    isActive: { type: Boolean, default: true },
    solveCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

problemSchema.index({ isActive: 1 }); 
problemSchema.index({ difficulty: 1, isActive: 1 }); 
problemSchema.index({ tags: 1 }); 

problemSchema.methods.toPublicObject = function () {
  const obj = this.toObject();
  obj.testCases = obj.testCases.filter((tc) => tc.isPublic);
  return obj;
};

export default mongoose.model("Problem", problemSchema);
