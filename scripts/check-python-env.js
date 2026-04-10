const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const candidates =
  process.platform === "win32"
    ? [path.join(rootDir, ".venv", "Scripts", "python.exe")]
    : [path.join(rootDir, ".venv", "bin", "python")];

const pythonPath = candidates.find((candidate) => {
  if (!fs.existsSync(candidate)) return false;
  try {
    return fs.statSync(candidate).isFile();
  } catch (_) {
    return false;
  }
});

if (!pythonPath) {
  console.error("\nERROR: .venv Python not found. Run setup first.\n");
  process.exit(1);
}

