const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const webDir = path.join(rootDir, "web");
const backendOnly = process.argv.includes("--backend-only");

function resolvePython() {
  const candidates =
    process.platform === "win32"
      ? [path.join(rootDir, ".venv", "Scripts", "python.exe")]
      : [path.join(rootDir, ".venv", "bin", "python")];

  return candidates.find((candidate) => {
    if (!fs.existsSync(candidate)) return false;
    try {
      return fs.statSync(candidate).isFile();
    } catch (_) {
      return false;
    }
  });
}

const pythonPath = resolvePython();
if (!pythonPath) {
  console.error("\nERROR: .venv Python not found. Run setup first.\n");
  process.exit(1);
}

const children = new Set();
let shuttingDown = false;

function startProcess(command, args, cwd, name, useShell = false) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: useShell,
  });
  children.add(child);

  child.on("exit", (code, signal) => {
    children.delete(child);
    if (shuttingDown) return;

    if (signal) {
      console.error(`${name} stopped with signal ${signal}`);
    } else if (code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }

    shutdown(code || 1);
  });

  child.on("error", (error) => {
    console.error(`${name} failed to start:`, error.message);
    shutdown(1);
  });

  return child;
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch (_) {
      // No-op.
    }
  }
  process.exit(exitCode);
}

const backendArgs = [
  "-m",
  "uvicorn",
  "grading_service.main:app",
  "--reload",
  "--reload-exclude",
  ".git",
  "--reload-exclude",
  ".venv",
  "--port",
  "8000",
  "--log-level",
  "info",
];

startProcess(pythonPath, backendArgs, rootDir, "backend");

if (!backendOnly) {
  if (process.platform === "win32") {
    startProcess("cmd.exe", ["/d", "/s", "/c", "npm run dev"], webDir, "frontend");
  } else {
    startProcess("npm", ["run", "dev"], webDir, "frontend");
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

