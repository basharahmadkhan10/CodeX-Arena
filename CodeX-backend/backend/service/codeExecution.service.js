import axios from "axios";

// Judge0 CE — free public instance
const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";

// Get free API key at: https://rapidapi.com/judge0-official/api/judge0-ce
// It's free tier: 50 req/day on basic, or use the open instance below
const JUDGE0_OPEN = "https://ce.judge0.com"; // open instance, no key needed

const LANGUAGE_IDS = {
  javascript: 63,  // Node.js 12.14.0
  python:     71,  // Python 3.8.1
  java:       62,  // Java OpenJDK 13.0.1
  cpp:        54,  // C++ (GCC 9.2.0)
  c:          50,  // C (GCC 9.2.0)
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_IDS);

const normalize = (s) =>
  (s || "").trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Submit code to Judge0 and poll for result.
 */
export const executeCode = async (code, language, stdin = "") => {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const cleanStdin = normalize(stdin.replace(/\\n/g, "\n"));

  try {
    // Submit
    const submitRes = await axios.post(
      `${JUDGE0_OPEN}/submissions?base64_encoded=false&wait=false`,
      {
        source_code: code,
        language_id: languageId,
        stdin: cleanStdin,
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 256000,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );

    const token = submitRes.data.token;
    if (!token) throw new Error("No submission token received");

    // Poll for result (max 10 attempts, 1s apart)
    for (let i = 0; i < 10; i++) {
      await sleep(1000);

      const resultRes = await axios.get(
        `${JUDGE0_OPEN}/submissions/${token}?base64_encoded=false`,
        { timeout: 10000 }
      );

      const data = resultRes.data;
      const statusId = data.status?.id;

      // Status IDs: 1=In Queue, 2=Processing, 3=AC, 4=WA, 5=TLE, 6=CE, 7-12=RE/other
      if (statusId <= 2) continue; // still running

      const stdout = normalize(data.stdout || "");
      const stderr = normalize(data.stderr || data.compile_output || "");
      const timed_out = statusId === 5;
      const ce = statusId === 6;
      const exitCode = data.exit_code ?? (statusId === 3 ? 0 : 1);

      return { output: stdout, stderr, exitCode, timed_out, ce };
    }

    throw new Error("Execution timed out waiting for Judge0 response");
  } catch (err) {
    if (err.response?.status === 429) {
      throw new Error("Judge0 rate limit reached. Try again in a moment.");
    }
    throw new Error(err.message || "Code execution failed");
  }
};

/**
 * Run code against all test cases.
 * Returns { passed, total, status, results, errorMessage }
 */
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
        // Fill rest as CE
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

      if (exec.exitCode !== 0 && exec.stderr && !exec.output) {
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

      const actual   = normalize(exec.output);
      const expected = normalize(tc.output);
      const isCorrect = actual === expected;

      if (isCorrect) passed++;
      else if (overallStatus === "AC") overallStatus = "WA";

      results.push({
        testCase: i + 1,
        input:          tc.isPublic ? tc.input    : "***hidden***",
        expectedOutput: tc.isPublic ? expected    : "***hidden***",
        actualOutput:   tc.isPublic ? actual      : isCorrect ? "✓ Correct" : "✗ Wrong",
        passed: isCorrect,
        isPublic: tc.isPublic,
      });
    } catch (err) {
      if (overallStatus === "AC") overallStatus = "RE";
      errorMessage = err.message;
      results.push({
        testCase: i + 1,
        input:          tc.isPublic ? tc.input  : "***hidden***",
        expectedOutput: tc.isPublic ? tc.output : "***hidden***",
        actualOutput:   `Error: ${err.message}`,
        passed: false,
        isPublic: tc.isPublic,
      });
    }
  }

  return { passed, total: testCases.length, status: overallStatus, results, errorMessage };
};