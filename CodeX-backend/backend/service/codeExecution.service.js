import axios from "axios";
const JUDGE0_URL = process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || null;

const PISTON_URL = "https://emkc.org/api/v2/piston";
const PISTON_LANGUAGES = {
  javascript: { language: "javascript", version: "1.32.3" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "cpp", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
};


const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_IDS);

const normalize = (s) =>
  (s || "").trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let judge0RequestCount = 0;
let judge0LastReset = Date.now();
const JUDGE0_MONTHLY_LIMIT = 45; 

function resetJudge0CountIfNeeded() {
  const now = Date.now();
  const daysSinceReset = (now - judge0LastReset) / (1000 * 60 * 60 * 24);
  if (daysSinceReset >= 30) {
    judge0RequestCount = 0;
    judge0LastReset = now;
    console.log("Judge0 counter reset for new month");
  }
}

function canUseJudge0() {
  resetJudge0CountIfNeeded();
  return JUDGE0_API_KEY && judge0RequestCount < JUDGE0_MONTHLY_LIMIT;
}

function getJudge0Headers() {
  return {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": JUDGE0_API_KEY,
    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  };
}

const executeWithPiston = async (code, language, stdin = "") => {
  const config = PISTON_LANGUAGES[language];
  if (!config) {
    throw new Error(`Piston: Unsupported language - ${language}`);
  }

  console.log(`📡 Using Piston API (backup) for ${language}`);

  const response = await fetch(`${PISTON_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: config.language,
      version: config.version,
      files: [{ content: code }],
      stdin: stdin || "",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Piston API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const stdout = (data.run?.stdout || "").trim();
  const stderr = (data.run?.stderr || "").trim();
  
  // Check for compilation error
  const hasCompilationError = stderr.includes("error") || stderr.includes("Error");
  
  return {
    output: stdout,
    stderr: stderr,
    exitCode: data.run?.code || (hasCompilationError ? 1 : 0),
    timed_out: false,
    ce: hasCompilationError && !stdout,
    source: "piston"
  };
};

const executeWithJudge0 = async (code, language, stdin = "") => {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error(`Judge0: Unsupported language - ${language}`);
  }

  const cleanStdin = normalize(stdin.replace(/\\n/g, "\n"));

  console.log(` Using Judge0 API (primary) - remaining: ${JUDGE0_MONTHLY_LIMIT - judge0RequestCount} requests`);

  const submitRes = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
    {
      source_code: code,
      language_id: languageId,
      stdin: cleanStdin,
      cpu_time_limit: 5,
      wall_time_limit: 10,
      memory_limit: 256000,
    },
    {
      headers: getJudge0Headers(),
      timeout: 15000,
    }
  );

  judge0RequestCount++;
  const token = submitRes.data.token;
  if (!token) throw new Error("No submission token received");

  for (let i = 0; i < 10; i++) {
    await sleep(1000);

    const resultRes = await axios.get(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
      {
        headers: getJudge0Headers(),
        timeout: 10000,
      }
    );

    const data = resultRes.data;
    const statusId = data.status?.id;
    
    if (statusId <= 2) continue; 

    const stdout = normalize(data.stdout || "");
    const stderr = normalize(data.stderr || data.compile_output || "");
    const timed_out = statusId === 5;
    const ce = statusId === 6;
    const exitCode = data.exit_code ?? (statusId === 3 ? 0 : 1);

    return {
      output: stdout,
      stderr: stderr,
      exitCode,
      timed_out,
      ce,
      source: "judge0"
    };
  }

  throw new Error("Execution timed out waiting for Judge0 response");
};

export const executeCode = async (code, language, stdin = "") => {
  if (canUseJudge0()) {
    try {
      const result = await executeWithJudge0(code, language, stdin);
      console.log(`✅ Execution via ${result.source} successful`);
      return result;
    } catch (error) {
      console.warn(`Judge0 failed: ${error.message}. Falling back to Piston...`);
      try {
        const result = await executeWithPiston(code, language, stdin);
        console.log(`Execution via ${result.source} successful (fallback)`);
        return result;
      } catch (pistonError) {
        throw new Error(`Both Judge0 and Piston failed. Judge0: ${error.message}, Piston: ${pistonError.message}`);
      }
    }
  } else {
    console.log(`Judge0 unavailable (key: ${!!JUDGE0_API_KEY}, remaining: ${JUDGE0_MONTHLY_LIMIT - judge0RequestCount}). Using Piston directly.`);
    try {
      const result = await executeWithPiston(code, language, stdin);
      console.log(` Execution via ${result.source} successful`);
      return result;
    } catch (error) {
      throw new Error(`Piston execution failed: ${error.message}`);
    }
  }
};

export const runTestCases = async (code, language, testCases) => {
  const results = [];
  let passed = 0;
  let overallStatus = "AC";
  let errorMessage = null;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];

    try {
      const exec = await executeCode(code, language, tc.input);

      if (exec.ce) {
        overallStatus = "CE";
        errorMessage = exec.stderr.slice(0, 500);
        results.push({
          testCase: i + 1,
          input: tc.isPublic ? tc.input : "***hidden***",
          expectedOutput: tc.isPublic ? tc.output : "***hidden***",
          actualOutput: `Compilation Error: ${exec.stderr.slice(0, 200)}`,
          passed: false,
          isPublic: tc.isPublic,
        });
        // Mark remaining as CE
        for (let j = i + 1; j < testCases.length; j++) {
          results.push({
            testCase: j + 1,
            input: testCases[j].isPublic ? testCases[j].input : "***hidden***",
            expectedOutput: testCases[j].isPublic ? testCases[j].output : "***hidden***",
            actualOutput: "Compilation Error",
            passed: false,
            isPublic: testCases[j].isPublic,
          });
        }
        break;
      }

      if (exec.timed_out) {
        if (overallStatus === "AC") overallStatus = "TLE";
        results.push({
          testCase: i + 1,
          input: tc.isPublic ? tc.input : "***hidden***",
          expectedOutput: tc.isPublic ? tc.output : "***hidden***",
          actualOutput: "Time Limit Exceeded",
          passed: false,
          isPublic: tc.isPublic,
        });
        continue;
      }

      if (exec.exitCode !== 0 && exec.stderr) {
        if (overallStatus === "AC") overallStatus = "RE";
        errorMessage = exec.stderr.slice(0, 300);
        results.push({
          testCase: i + 1,
          input: tc.isPublic ? tc.input : "***hidden***",
          expectedOutput: tc.isPublic ? tc.output : "***hidden***",
          actualOutput: `Runtime Error: ${exec.stderr.slice(0, 150)}`,
          passed: false,
          isPublic: tc.isPublic,
        });
        continue;
      }

      const actual = normalize(exec.output);
      const expected = normalize(tc.output);
      const isCorrect = actual === expected;

      if (isCorrect) passed++;
      else if (overallStatus === "AC") overallStatus = "WA";

      results.push({
        testCase: i + 1,
        input: tc.isPublic ? tc.input : "***hidden***",
        expectedOutput: tc.isPublic ? expected : "***hidden***",
        actualOutput: tc.isPublic ? actual : (isCorrect ? "✓ Correct" : "✗ Wrong"),
        passed: isCorrect,
        isPublic: tc.isPublic,
      });
    } catch (err) {
      if (overallStatus === "AC") overallStatus = "RE";
      errorMessage = err.message;
      results.push({
        testCase: i + 1,
        input: tc.isPublic ? tc.input : "***hidden***",
        expectedOutput: tc.isPublic ? tc.output : "***hidden***",
        actualOutput: `Error: ${err.message}`,
        passed: false,
        isPublic: tc.isPublic,
      });
    }
  }

  return {
    passed,
    total: testCases.length,
    status: overallStatus,
    results,
    errorMessage,
  };
};

export const getExecutionStatus = () => {
  resetJudge0CountIfNeeded();
  return {
    judge0: {
      available: !!JUDGE0_API_KEY,
      remainingRequests: JUDGE0_API_KEY ? Math.max(0, JUDGE0_MONTHLY_LIMIT - judge0RequestCount) : 0,
      limit: JUDGE0_MONTHLY_LIMIT,
    },
    piston: {
      available: true,
      type: "backup",
    },
  };
};
