import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Full demo orchestration script:
 * 1. Seeds normal logs
 * 2. Starts the demo app
 * 3. Triggers the incident
 * 4. Prints instructions for running the agent
 */
const ROOT = join(__dirname, "..");

function run(cmd: string, label: string) {
  console.log(`\n--- ${label} ---`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: "inherit" });
  } catch (err: any) {
    console.error(`Failed: ${label}`, err.message);
    process.exit(1);
  }
}

console.log("=== Incident Responder Agent - Demo Setup ===\n");

// Step 1: Seed normal logs
run("npx tsx scripts/seed-logs.ts", "Seeding baseline logs");

// Step 2: Start demo app in background
console.log("\n--- Starting demo app ---");
const startCmd = process.platform === "win32"
  ? `start /B npx tsx demo-app/server.ts`
  : `npx tsx demo-app/server.ts &`;
execSync(startCmd, { cwd: ROOT, stdio: "ignore", shell: true, env: { ...process.env, FORCE_ERROR: "false" } });

// Wait for app to be ready
console.log("Waiting for demo app to start...");
execSync(process.platform === "win32" ? "timeout /t 3 /nobreak >nul" : "sleep 3", { stdio: "ignore", shell: true });

// Step 3: Trigger the incident
run("npx tsx scripts/trigger-incident.ts", "Triggering incident");

console.log(`
=== Demo Ready ===

The demo app is running on http://localhost:3001 with FORCE_ERROR=true.
The /checkout endpoint is now returning 500 errors.

Next steps:
1. Start TrueForge:      npx @truefoundry/trueforge
2. Configure connectors: Add the incident-responder MCP server (see README)
3. Create the agent:     npm run setup-agent
4. Open TrueForge UI:    http://localhost:8790
5. Select 'incident-responder' agent and send:
   "There's an incident affecting the checkout endpoint. Investigate and fix it."

The agent will:
  - Read logs and detect the error pattern
  - Analyze recent commits (via GitHub MCP)
  - Diagnose the root cause
  - Propose a fix
  - PAUSE for your approval before executing
  - Apply the fix and verify

Press Ctrl+C to stop the demo app.
`);
