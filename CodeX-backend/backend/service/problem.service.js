import Problem from "../models/Problem.js";

export const getRandomProblems = async (count = 4) => {
  // Get random problems from database
  const problems = await Problem.aggregate([
    { $match: { isActive: true } },
    { $sample: { size: count } }
  ]);
  
  if (problems.length < count) {
    throw new Error(`Only ${problems.length} problems available, need ${count}`);
  }
  
  return problems;
};

export const getRandomProblem = async () => {
  const problems = await getRandomProblems(1);
  return problems[0];
};
