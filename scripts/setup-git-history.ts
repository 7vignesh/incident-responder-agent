import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/**
 * Creates a realistic git commit history for the demo.
 * Run this once after `git init` to set up commits the agent can investigate.
 *
 * Prerequisites: git must be initialized in the repo root.
 */
function run(cmd: string) {
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

console.log("Setting up demo git history...\n");

// Check if git is initialized
try {
  execSync("git status", { cwd: ROOT, stdio: "ignore" });
} catch {
  console.log("Initializing git repository...");
  run("git init");
  run("git branch -M main");
}

// Commit 1: Base app
run("git add demo-app/server.ts demo-app/logger.ts package.json tsconfig.json .gitignore");
run('git commit --allow-empty -m "feat: add Express demo app with /health, /checkout, /products endpoints"');

// Commit 2: Logging
run("git add mcp-server/ scripts/seed-logs.ts");
run('git commit --allow-empty -m "chore: add structured JSON logging and MCP server"');

// Commit 3: The bad commit - introduces FORCE_ERROR
run("git add scripts/trigger-incident.ts scripts/reset-incident.ts");
run('git commit --allow-empty -m "feat: add payment gateway timeout simulation for load testing\n\nAdded FORCE_ERROR env var that simulates payment gateway timeouts.\nSet FORCE_ERROR=true to test monitoring alerts under load."');

// Commit 4: Config change that enables the bug
run("git add .env.example trueforge/ scripts/run-demo.ts README.md docs/");
run('git commit --allow-empty -m "chore: update env defaults and add TrueForge agent config\n\nSet FORCE_ERROR=true for overnight load test run."');

console.log("\nDone! Git history created with 4 commits.");
console.log("The agent will find commit 3-4 as the likely root cause.");
console.log("\nPush to GitHub with: git remote add origin <url> && git push -u origin main");
