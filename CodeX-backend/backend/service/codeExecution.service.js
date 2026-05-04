import axios from "axios";

// ─── Environment ────────────────────────────────────────────────────────────
const JUDGE0_URL      = process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY  = process.env.JUDGE0_API_KEY || null;
const JDOODLE_CLIENT  = process.env.JDOODLE_CLIENT_ID || null;
const JDOODLE_SECRET  = process.env.JDOODLE_CLIENT_SECRET || null;
const PISTON_URL      = "https://emkc.org/api/v2/piston";

// ─── Language Maps ───────────────────────────────────────────────────────────
const JUDGE0_LANGUAGE_IDS = {
  javascript: 63,
  python:     71,
  java:       62,
  cpp:        54,
  c:          50,
};

const PISTON_LANGUAGES = {
  javascript: { language: "javascript", version: "18.15.0" },
  python:     { language: "python",     version: "3.10.0"  },
  java:       { language: "java",       version: "15.0.2"  },
  cpp:        { language: "cpp",        version: "10.2.0"  },
  c:          { language: "c",          version: "10.2.0"  },
};

// JDoodle language strings + version index
const JDOODLE_LANGUAGES = {
  javascript: { language: "nodejs",   versionIndex: "4" },
  python:     { language: "python3",  versionIndex: "4" },
  java:       { language: "java",     versionIndex: "4" },
  cpp:        { language: "cpp17",    versionIndex: "1" },
  c:          { language: "c",        versionIndex: "5" },
};

export const SUPPORTED_LANGUAGES = Object.keys(JUDGE0_LANGUAGE_IDS);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sleep  = (ms) => new Promise((r) => setTimeout(r, ms));
const normalize = (s) =>
  (s || "").trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");

/**
 * Retry wrapper — retries `fn` up to `attempts` times with exponential back-off.
 */
async function withRetry(fn, attempts = 2, delayMs = 800) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await sleep(delayMs * (i + 1));
    }
  }
  throw lastErr;
}

// ─── Judge0 ──────────────────────────────────────────────────────────────────
// Monthly counter stored in-memory (resets every 30 days).
let judge0Count      = 0;
let judge0LastReset  = Date.now();
const JUDGE0_LIMIT   = parseInt(process.env.JUDGE0_MONTHLY_LIMIT || "45", 10);

function resetJudge0IfNeeded() {
  if (Date.now() - judge0LastReset >= 30 * 24 * 60 * 60 * 1000) {
    judge0Count     = 0;
    judge0LastReset = Date.now();
    console.log("[Judge0] monthly counter reset");
  }
}

function canUseJudge0() {
  resetJudge0IfNeeded();
  return !!(JUDGE0_API_KEY && judge0Count < JUDGE0_LIMIT);
}

async function executeWithJudge0(code, language, stdin = "") {
  const languageId = JUDGE0_LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Judge0: unsupported language — ${language}`);

  const headers = {
    "Content-Type":   "application/json",
    "X-RapidAPI-Key": JUDGE0_API_KEY,
    "X-RapidAPI-Host":"judge0-ce.p.rapidapi.com",
  };

  console.log(`[Judge0] submitting (remaining: ${JUDGE0_LIMIT - judge0Count})`);

  const submitRes = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
    {
      source_code:      code,
      language_id:      languageId,
      stdin:            normalize(stdin.replace(/\\n/g, "\n")),
      cpu_time_limit:   5,
      wall_time_limit:  10,
      memory_limit:     256000,
    },
    { headers, timeout: 15_000 }
  );

  judge0Count++;
  const token = submitRes.data?.token;
  if (!token) throw new Error("Judge0: no submission token received");

  // Poll up to 12 times (12 s)
  for (let i = 0; i < 12; i++) {
    await sleep(1000);
    const res = await axios.get(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
      { headers, timeout: 10_000 }
    );
    const d        = res.data;
    const statusId = d.status?.id;
    if (statusId <= 2) continue; // queued / processing

    return {
      output:    normalize(d.stdout || ""),
      stderr:    normalize(d.stderr || d.compile_output || ""),
      exitCode:  d.exit_code ?? (statusId === 3 ? 0 : 1),
      timed_out: statusId === 5,
      ce:        statusId === 6,
      source:    "judge0",
    };
  }
  throw new Error("Judge0: polling timed out");
}

// ─── JDoodle ─────────────────────────────────────────────────────────────────
function canUseJDoodle() {
  return !!(JDOODLE_CLIENT && JDOODLE_SECRET);
}

async function executeWithJDoodle(code, language, stdin = "") {
  const cfg = JDOODLE_LANGUAGES[language];
  if (!cfg) throw new Error(`JDoodle: unsupported language — ${language}`);

  console.log("[JDoodle] submitting...");

  const res = await axios.post(
    "https://api.jdoodle.com/v1/execute",
    {
      clientId:     JDOODLE_CLIENT,
      clientSecret: JDOODLE_SECRET,
      script:       code,
      stdin:        stdin || "",
      language:     cfg.language,
      versionIndex: cfg.versionIndex,
    },
    { timeout: 20_000 }
  );

  const d      = res.data;
  // JDoodle returns statusCode 200 even on errors; inspect output field
  const output = normalize(d.output || "");
  const isErr  = (d.statusCode !== 200) || output.toLowerCase().startsWith("jdoodle: error");
  const isCE   = isErr && (
    output.includes("compilation error") ||
    output.includes("error:") ||
    output.includes("SyntaxError")
  );

  if (d.statusCode === 429) throw new Error("JDoodle: daily limit reached");

  return {
    output:    isErr ? ""  : output,
    stderr:    isErr ? output : "",
    exitCode:  isErr ? 1 : 0,
    timed_out: output.includes("Time Limit Exceeded"),
    ce:        isCE,
    source:    "jdoodle",
  };
}

// ─── Piston ──────────────────────────────────────────────────────────────────
async function executeWithPiston(code, language, stdin = "") {
  const cfg = PISTON_LANGUAGES[language];
  if (!cfg) throw new Error(`Piston: unsupported language — ${language}`);

  console.log("[Piston] submitting...");

  const res = await fetch(`${PISTON_URL}/execute`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: cfg.language,
      version:  cfg.version,
      files:    [{ content: code }],
      stdin:    stdin || "",
    }),
    signal: AbortSignal.timeout(25_000), // hard 25 s cap
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Piston: HTTP ${res.status} — ${text.slice(0, 200)}`);
  }

  const d      = await res.json();
  const stdout = normalize(d.run?.stdout || "");
  const stderr = normalize(d.run?.stderr || d.compile?.stderr || "");
  const exitCode = d.run?.code ?? (stderr ? 1 : 0);
  const isCE  = !!(d.compile?.code && d.compile.code !== 0);

  return {
    output:    stdout,
    stderr:    stderr,
    exitCode:  isCE ? 1 : exitCode,
    timed_out: stderr.includes("Time Limit") || exitCode === 124,
    ce:        isCE,
    source:    "piston",
  };
}

// ─── Public: executeCode ──────────────────────────────────────────────────────
/**
 * Priority chain:
 *   1. Judge0  (if API key set + monthly quota remaining)
 *   2. JDoodle (if credentials set)
 *   3. Piston  (always available, public)
 *
 * Each engine is wrapped in withRetry(…, 2) before falling to the next.
 */
export async function executeCode(code, language, stdin = "") {
  const engines = [];

  if (canUseJudge0())  engines.push({ name: "Judge0",  fn: () => executeWithJudge0(code, language, stdin)  });
  if (canUseJDoodle()) engines.push({ name: "JDoodle", fn: () => executeWithJDoodle(code, language, stdin) });
  engines.push(          { name: "Piston",  fn: () => executeWithPiston(code, language, stdin)  });

  const errors = [];
  for (const engine of engines) {
    try {
      const result = await withRetry(engine.fn, 2, 800);
      console.log(`[Executor] ✅ success via ${result.source}`);
      return result;
    } catch (err) {
      console.warn(`[Executor] ⚠️  ${engine.name} failed: ${err.message}`);
      errors.push(`${engine.name}: ${err.message}`);
    }
  }

  throw new Error(`All execution engines failed.\n${errors.join("\n")}`);
}

// ─── Public: runTestCases ────────────────────────────────────────────────────
export async function runTestCases(code, language, testCases) {
  const results      = [];
  let passed         = 0;
  let overallStatus  = "AC";
  let errorMessage   = null;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];

    try {
      const exec = await executeCode(code, language, tc.input);

      // ── Compilation Error ────────────────────────────────────────────────
      if (exec.ce) {
        overallStatus = "CE";
        errorMessage  = exec.stderr.slice(0, 500);
        results.push(makeResult(i, tc, `Compilation Error:\n${exec.stderr.slice(0, 200)}`, false));

        // Mark all remaining as CE without re-executing
        for (let j = i + 1; j < testCases.length; j++) {
          results.push(makeResult(j, testCases[j], "Compilation Error", false));
        }
        break;
      }

      // ── Time Limit Exceeded ──────────────────────────────────────────────
      if (exec.timed_out) {
        if (overallStatus === "AC") overallStatus = "TLE";
        results.push(makeResult(i, tc, "Time Limit Exceeded", false));
        continue;
      }

      // ── Runtime Error ────────────────────────────────────────────────────
      if (exec.exitCode !== 0 && exec.stderr) {
        if (overallStatus === "AC") overallStatus = "RE";
        errorMessage = exec.stderr.slice(0, 300);
        results.push(makeResult(i, tc, `Runtime Error:\n${exec.stderr.slice(0, 150)}`, false));
        continue;
      }

      // ── Compare output ───────────────────────────────────────────────────
      const actual   = normalize(exec.output);
      const expected = normalize(tc.output);
      const ok       = actual === expected;

      if (ok) passed++;
      else if (overallStatus === "AC") overallStatus = "WA";

      results.push({
        testCase:       i + 1,
        input:          tc.isPublic ? tc.input    : "***hidden***",
        expectedOutput: tc.isPublic ? expected    : "***hidden***",
        actualOutput:   tc.isPublic ? actual      : (ok ? "✓ Correct" : "✗ Wrong"),
        passed:         ok,
        isPublic:       tc.isPublic,
      });

    } catch (err) {
      if (overallStatus === "AC") overallStatus = "RE";
      errorMessage = err.message;
      results.push(makeResult(i, tc, `Error: ${err.message}`, false));
    }
  }

  return { passed, total: testCases.length, status: overallStatus, results, errorMessage };
}

function makeResult(i, tc, actualOutput, passed) {
  return {
    testCase:       i + 1,
    input:          tc.isPublic ? tc.input  : "***hidden***",
    expectedOutput: tc.isPublic ? tc.output : "***hidden***",
    actualOutput,
    passed,
    isPublic:       tc.isPublic,
  };
}

// ─── Public: getExecutionStatus ──────────────────────────────────────────────
export function getExecutionStatus() {
  resetJudge0IfNeeded();
  return {
    judge0: {
      available:         canUseJudge0(),
      remainingRequests: JUDGE0_API_KEY ? Math.max(0, JUDGE0_LIMIT - judge0Count) : 0,
      limit:             JUDGE0_LIMIT,
    },
    jdoodle: {
      available: canUseJDoodle(),
      type:      "primary-backup",
    },
    piston: {
      available: true,
      type:      "last-resort",
    },
  };
}
