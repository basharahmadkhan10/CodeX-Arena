import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import crypto from "crypto";
import { fileURLToPath } from "url";

const JUDGE0_URL = process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || null;
const JDOODLE_CLIENT = process.env.JDOODLE_CLIENT_ID || null;
const JDOODLE_SECRET = process.env.JDOODLE_CLIENT_SECRET || null;
const PISTON_URL = process.env.PISTON_URL || "https://emkc.org/api/v2/piston";

const JUDGE0_LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

const PISTON_LANGUAGES = {
  javascript: { language: "javascript", version: "18.15.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "cpp", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
};

const JDOODLE_LANGUAGES = {
  javascript: { language: "nodejs", versionIndex: "4" },
  python: { language: "python3", versionIndex: "4" },
  java: { language: "java", versionIndex: "4" },
  cpp: { language: "cpp17", versionIndex: "1" },
  c: { language: "c", versionIndex: "5" },
};

export const SUPPORTED_LANGUAGES = Object.keys(JUDGE0_LANGUAGE_IDS);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normalize = (s) =>
  (s || "").trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");

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

// State Persistence for Judge0 Limits
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, "..", "compiler_state.json");

let judge0Count = 0;
let judge0LastReset = Date.now();
const JUDGE0_LIMIT = parseInt(process.env.JUDGE0_MONTHLY_LIMIT || "1000", 10);

function loadCompilerState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      judge0Count = data.judge0Count ?? 0;
      judge0LastReset = data.judge0LastReset ?? Date.now();
      console.log(`[Judge0 State] Loaded: count=${judge0Count}, lastReset=${new Date(judge0LastReset).toISOString()}`);
    } else {
      saveCompilerState();
    }
  } catch (err) {
    console.error("[Judge0 State] Error loading state:", err.message);
  }
}

function saveCompilerState() {
  try {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ judge0Count, judge0LastReset }, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("[Judge0 State] Error saving state:", err.message);
  }
}

// Load initial state
loadCompilerState();

function resetJudge0IfNeeded() {
  if (Date.now() - judge0LastReset >= 30 * 24 * 60 * 60 * 1000) {
    judge0Count = 0;
    judge0LastReset = Date.now();
    saveCompilerState();
    console.log("[Judge0] monthly counter reset");
  }
}

// Circuit Breaker System
const SUSPENSION_COOLDOWN_MS = 5 * 60 * 1000; // Suspend failing engine for 5 mins
const engineStatus = {
  Judge0: { suspendedUntil: null, reason: "" },
  JDoodle: { suspendedUntil: null, reason: "" },
  Piston: { suspendedUntil: null, reason: "" },
};

function suspendEngine(name, reason) {
  engineStatus[name] = {
    suspendedUntil: Date.now() + SUSPENSION_COOLDOWN_MS,
    reason,
  };
  console.warn(`[Executor] ${name} suspended for 5m due to: ${reason}`);
}

function isEngineSuspended(name) {
  const state = engineStatus[name];
  if (state.suspendedUntil && Date.now() < state.suspendedUntil) {
    return true;
  }
  state.suspendedUntil = null; // Reset once cooldown has passed
  return false;
}

function canUseJudge0() {
  if (isEngineSuspended("Judge0")) return false;
  resetJudge0IfNeeded();
  return !!(JUDGE0_API_KEY && judge0Count < JUDGE0_LIMIT);
}

async function executeWithJudge0(code, language, stdin = "") {
  const languageId = JUDGE0_LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Judge0: unsupported language — ${language}`);

  const headers = {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": JUDGE0_API_KEY,
    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  };

  console.log(`[Judge0] submitting (remaining: ${JUDGE0_LIMIT - judge0Count})`);

  try {
    const submitRes = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin: normalize(stdin.replace(/\\n/g, "\n")),
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 256000,
      },
      { headers, timeout: 20_000 }
    );

    judge0Count++;
    saveCompilerState();

    const d = submitRes.data;
    if (!d || !d.status) throw new Error("Judge0: invalid response received");

    const statusId = d.status.id;
    return {
      output: normalize(d.stdout || ""),
      stderr: normalize(d.stderr || d.compile_output || ""),
      exitCode: d.exit_code ?? (statusId === 3 ? 0 : 1),
      timed_out: statusId === 5,
      ce: statusId === 6,
      source: "judge0",
    };
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    const msg = data?.message || data?.error || err.message;

    if (status === 401 || status === 403) {
      suspendEngine("Judge0", `Auth/Subscription issue: ${msg}`);
      throw new Error(`Judge0 Auth/Subscription Error (${status}): ${msg}. Verify JUDGE0_API_KEY in .env.`);
    } else if (status === 429) {
      suspendEngine("Judge0", `Rate limit / monthly quota reached: ${msg}`);
      throw new Error(`Judge0 Rate Limit (429): ${msg}. You have exceeded your API usage limit.`);
    }
    throw err;
  }
}

function canUseJDoodle() {
  if (isEngineSuspended("JDoodle")) return false;
  return !!(JDOODLE_CLIENT && JDOODLE_SECRET);
}

async function executeWithJDoodle(code, language, stdin = "") {
  const cfg = JDOODLE_LANGUAGES[language];
  if (!cfg) throw new Error(`JDoodle: unsupported language — ${language}`);

  console.log("[JDoodle] submitting...");

  try {
    const res = await axios.post(
      "https://api.jdoodle.com/v1/execute",
      {
        clientId: JDOODLE_CLIENT,
        clientSecret: JDOODLE_SECRET,
        script: code,
        stdin: stdin || "",
        language: cfg.language,
        versionIndex: cfg.versionIndex,
      },
      { timeout: 20_000 }
    );

    const d = res.data;

    if (d.statusCode === 401 || d.statusCode === 403) {
      suspendEngine("JDoodle", `Auth issue: ${d.error || 'Invalid credentials'}`);
      throw new Error(`JDoodle Auth Error (${d.statusCode}): ${d.error || 'Invalid credentials'}. Check credentials in .env.`);
    }
    if (d.statusCode === 429) {
      suspendEngine("JDoodle", "Daily limit reached");
      throw new Error(`JDoodle Rate Limit (429): ${d.error || 'Daily limit reached'}.`);
    }

    const output = normalize(d.output || "");
    const isErr = (d.statusCode !== 200) || output.toLowerCase().startsWith("jdoodle: error");
    const isCE = isErr && (
      output.includes("compilation error") ||
      output.includes("error:") ||
      output.includes("SyntaxError")
    );

    return {
      output: isErr ? "" : output,
      stderr: isErr ? output : "",
      exitCode: isErr ? 1 : 0,
      timed_out: output.includes("Time Limit Exceeded"),
      ce: isCE,
      source: "jdoodle",
    };
  } catch (err) {
    if (err.message.startsWith("JDoodle Auth") || err.message.startsWith("JDoodle Rate")) {
      throw err;
    }
    const status = err.response?.status;
    const data = err.response?.data;
    const msg = data?.error || data?.message || err.message;

    if (status === 401 || status === 403) {
      suspendEngine("JDoodle", `Auth issue: ${msg}`);
      throw new Error(`JDoodle Auth Error (${status}): ${msg}. Check client credentials in .env.`);
    } else if (status === 429) {
      suspendEngine("JDoodle", `Rate limit: ${msg}`);
      throw new Error(`JDoodle Rate Limit (429): ${msg}`);
    }
    throw err;
  }
}

async function executeWithPiston(code, language, stdin = "") {
  const cfg = PISTON_LANGUAGES[language];
  if (!cfg) throw new Error(`Piston: unsupported language — ${language}`);

  console.log("[Piston] submitting...");

  try {
    const res = await fetch(`${PISTON_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: cfg.language,
        version: cfg.version,
        files: [{ content: code }],
        stdin: stdin || "",
      }),
      signal: AbortSignal.timeout(25_000), // hard 25 s cap
    });

    if (!res.ok) {
      const text = await res.text();
      let parsed = {};
      try { parsed = JSON.parse(text); } catch (e) { }
      const msg = parsed.message || text.slice(0, 200);

      if (res.status === 401 || res.status === 403) {
        suspendEngine("Piston", `Auth issue: ${msg}`);
        throw new Error(`Piston Auth Error (${res.status}): ${msg}. Public Piston API is now whitelist-only. Run your own Piston server and set PISTON_URL in .env.`);
      } else if (res.status === 429) {
        suspendEngine("Piston", `Rate Limit / Limit reached: ${msg}`);
        throw new Error(`Piston Rate Limit (429): ${msg}`);
      }
      throw new Error(`Piston: HTTP ${res.status} — ${msg}`);
    }

    const d = await res.json();
    const stdout = normalize(d.run?.stdout || "");
    const stderr = normalize(d.run?.stderr || d.compile?.stderr || "");
    const exitCode = d.run?.code ?? (stderr ? 1 : 0);
    const isCE = !!(d.compile?.code && d.compile.code !== 0);

    return {
      output: stdout,
      stderr: stderr,
      exitCode: isCE ? 1 : exitCode,
      timed_out: stderr.includes("Time Limit") || exitCode === 124,
      ce: isCE,
      source: "piston",
    };
  } catch (err) {
    if (err.message.startsWith("Piston Auth") || err.message.startsWith("Piston Rate")) {
      throw err;
    }
    throw err;
  }
}

async function executeLocally(code, language, stdin = "") {
  return new Promise((resolve) => {
    const randomId = crypto.randomBytes(6).toString("hex");

    if (language === "javascript") {
      const filePath = path.join(os.tmpdir(), `codex_${randomId}.js`);
      try {
        fs.writeFileSync(filePath, code);
        runProcess(process.execPath, [filePath], filePath, stdin, resolve);
      } catch (err) {
        resolve({ output: "", stderr: err.message, exitCode: 1, timed_out: false, ce: false, source: "local-node" });
      }
    } else if (language === "python") {
      const filePath = path.join(os.tmpdir(), `codex_${randomId}.py`);
      try {
        fs.writeFileSync(filePath, code);
        const pythonCmd = process.platform === "win32" ? "python" : "python3";
        runProcess(pythonCmd, [filePath], filePath, stdin, resolve);
      } catch (err) {
        resolve({ output: "", stderr: err.message, exitCode: 1, timed_out: false, ce: false, source: "local-python" });
      }
    } else if (language === "cpp" || language === "c") {
      const ext = language === "cpp" ? "cpp" : "c";
      const srcPath = path.join(os.tmpdir(), `codex_${randomId}.${ext}`);
      const outPath = path.join(os.tmpdir(), `codex_${randomId}${process.platform === "win32" ? ".exe" : ".out"}`);

      try {
        fs.writeFileSync(srcPath, code);
      } catch (e) {
        return resolve({ output: "", stderr: e.message, exitCode: 1, timed_out: false, ce: false, source: "local-gcc" });
      }

      const compiler = language === "cpp" ? "g++" : "gcc";
      const compileProcess = spawn(compiler, [srcPath, "-O2", "-o", outPath], { timeout: 8000 });
      let compileErr = "";

      compileProcess.stderr?.on("data", (d) => { compileErr += d.toString(); });
      compileProcess.on("close", (cCode) => {
        try { if (fs.existsSync(srcPath)) fs.unlinkSync(srcPath); } catch { }
        if (cCode !== 0) {
          return resolve({
            output: "",
            stderr: compileErr || "Compilation Error",
            exitCode: 1,
            timed_out: false,
            ce: true,
            source: "local-gcc",
          });
        }
        runProcess(outPath, [], outPath, stdin, resolve);
      });

      compileProcess.on("error", (err) => {
        try { if (fs.existsSync(srcPath)) fs.unlinkSync(srcPath); } catch { }
        resolve({
          output: "",
          stderr: `Local compiler error: ${err.message}`,
          exitCode: 1,
          timed_out: false,
          ce: true,
          source: "local-gcc",
        });
      });
    } else {
      resolve({
        output: "",
        stderr: `Language ${language} not supported by local fallback`,
        exitCode: 1,
        timed_out: false,
        ce: false,
        source: "local",
      });
    }
  });
}

function runProcess(cmd, args, cleanupPath, stdin, resolve) {
  let stdout = "";
  let stderr = "";
  let timedOut = false;

  let child;
  try {
    child = spawn(cmd, args, { timeout: 4000 });
  } catch (err) {
    try { if (cleanupPath && fs.existsSync(cleanupPath)) fs.unlinkSync(cleanupPath); } catch { }
    return resolve({ output: "", stderr: err.message, exitCode: 1, timed_out: false, ce: false, source: "local-runner" });
  }

  const timer = setTimeout(() => {
    timedOut = true;
    try { child.kill("SIGKILL"); } catch { }
  }, 4000);

  child.stdout?.on("data", (d) => {
    stdout += d.toString();
    if (stdout.length > 50000) {
      try { child.kill("SIGKILL"); } catch { }
    }
  });

  child.stderr?.on("data", (d) => {
    stderr += d.toString();
    if (stderr.length > 50000) {
      try { child.kill("SIGKILL"); } catch { }
    }
  });

  child.on("close", (code) => {
    clearTimeout(timer);
    try {
      if (cleanupPath && fs.existsSync(cleanupPath)) fs.unlinkSync(cleanupPath);
    } catch { }

    resolve({
      output: normalize(stdout),
      stderr: normalize(stderr),
      exitCode: timedOut ? 1 : (code ?? 0),
      timed_out: timedOut,
      ce: false,
      source: "local-runner",
    });
  });

  child.on("error", (err) => {
    clearTimeout(timer);
    try {
      if (cleanupPath && fs.existsSync(cleanupPath)) fs.unlinkSync(cleanupPath);
    } catch { }

    resolve({
      output: "",
      stderr: err.message,
      exitCode: 1,
      timed_out: false,
      ce: false,
      source: "local-runner",
    });
  });

  if (child.stdin) {
    if (stdin) {
      child.stdin.write(stdin);
      if (!stdin.endsWith("\n")) child.stdin.write("\n");
    }
    child.stdin.end();
  }
}

export async function executeCode(code, language, stdin = "") {
  const engines = [];

  if (canUseJudge0()) engines.push({ name: "Judge0", fn: () => executeWithJudge0(code, language, stdin) });
  if (canUseJDoodle()) engines.push({ name: "JDoodle", fn: () => executeWithJDoodle(code, language, stdin) });

  if (!isEngineSuspended("Piston")) {
    engines.push({ name: "Piston", fn: () => executeWithPiston(code, language, stdin) });
  } else {
    console.warn(`[Executor] Skipping Piston: Engine is suspended`);
  }

  // Built-in Local Runner guarantees 100% uptime for JS, Python, C, C++
  engines.push({ name: "LocalRunner", fn: () => executeLocally(code, language, stdin) });

  const errors = [];
  for (const engine of engines) {
    try {
      const result = await withRetry(engine.fn, engine.name === "LocalRunner" ? 1 : 2, 800);
      console.log(`[Executor] success via ${result.source}`);
      return result;
    } catch (err) {
      console.warn(`[Executor] ${engine.name} failed: ${err.message}`);
      errors.push(`${engine.name}: ${err.message}`);
    }
  }

  throw new Error(`All execution engines failed.\n${errors.join("\n")}`);
}

export async function runTestCases(code, language, testCases) {
  const results = new Array(testCases.length);
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
        results[i] = makeResult(i, tc, `Compilation Error:\n${exec.stderr.slice(0, 200)}`, false);
        break; // Exit early on compilation error
      }

      if (exec.timed_out) {
        overallStatus = "TLE";
        results[i] = makeResult(i, tc, "Time Limit Exceeded", false);
        break; // Exit early on time limit exceeded
      }

      if (exec.exitCode !== 0 && exec.stderr) {
        overallStatus = "RE";
        errorMessage = exec.stderr.slice(0, 300);
        results[i] = makeResult(i, tc, `Runtime Error:\n${exec.stderr.slice(0, 150)}`, false);
        break; // Exit early on runtime error
      }

      const actual = normalize(exec.output);
      const expected = normalize(tc.output);
      const ok = actual === expected;

      if (ok) {
        passed++;
      } else {
        overallStatus = "WA";
        results[i] = {
          testCase: i + 1,
          input: tc.isPublic ? tc.input : "***hidden***",
          expectedOutput: tc.isPublic ? expected : "***hidden***",
          actualOutput: tc.isPublic ? actual : "✗ Wrong",
          passed: false,
          isPublic: tc.isPublic,
        };
        break; // Exit early on wrong answer
      }

      results[i] = {
        testCase: i + 1,
        input: tc.isPublic ? tc.input : "***hidden***",
        expectedOutput: tc.isPublic ? expected : "***hidden***",
        actualOutput: tc.isPublic ? actual : "✓ Correct",
        passed: true,
        isPublic: tc.isPublic,
      };

    } catch (err) {
      overallStatus = "RE";
      errorMessage = err.message;
      results[i] = makeResult(i, tc, `Error: ${err.message}`, false);
      break; // Exit early on connection/API failure
    }
  }

  // Populate any unrun test cases due to early exit with placeholder info so frontend renders it cleanly
  for (let j = 0; j < testCases.length; j++) {
    if (!results[j]) {
      results[j] = {
        testCase: j + 1,
        input: testCases[j].isPublic ? testCases[j].input : "***hidden***",
        expectedOutput: testCases[j].isPublic ? testCases[j].output : "***hidden***",
        actualOutput: overallStatus === "CE" ? "Compilation Error" : "Skipped",
        passed: false,
        isPublic: testCases[j].isPublic,
      };
    }
  }

  return { passed, total: testCases.length, status: overallStatus, results, errorMessage };
}

function makeResult(i, tc, actualOutput, passed) {
  return {
    testCase: i + 1,
    input: tc.isPublic ? tc.input : "***hidden***",
    expectedOutput: tc.isPublic ? tc.output : "***hidden***",
    actualOutput,
    passed,
    isPublic: tc.isPublic,
  };
}

export function getExecutionStatus() {
  resetJudge0IfNeeded();
  return {
    judge0: {
      available: canUseJudge0(),
      remainingRequests: JUDGE0_API_KEY ? Math.max(0, JUDGE0_LIMIT - judge0Count) : 0,
      limit: JUDGE0_LIMIT,
    },
    jdoodle: {
      available: canUseJDoodle(),
      type: "primary-backup",
    },
    piston: {
      available: !isEngineSuspended("Piston"),
      type: "last-resort",
    },
  };
}
