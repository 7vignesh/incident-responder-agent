import { appendFileSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Simulates the incident: writes error log entries (as if FORCE_ERROR was just enabled)
 * and creates a .env file with FORCE_ERROR=true.
 */
const LOGS_DIR = join(__dirname, "..", "logs");
const LOGS_FILE = join(LOGS_DIR, "app.jsonl");
const ENV_FILE = join(__dirname, "..", ".env");

mkdirSync(LOGS_DIR, { recursive: true });

// Write error entries for the last 2 minutes
const now = Date.now();
const errorEntries = [];

for (let i = 12; i >= 1; i--) {
  const ts = new Date(now - i * 10_000).toISOString(); // every 10s

  errorEntries.push({
    timestamp: ts,
    level: "error",
    endpoint: "/checkout",
    method: "POST",
    statusCode: 500,
    message: "PaymentProcessingError: connection to payment gateway timed out",
    error: "PaymentProcessingError: connection to payment gateway timed out",
    durationMs: 5000,
  });

  // Health still works during incident
  errorEntries.push({
    timestamp: ts,
    level: "info",
    endpoint: "/health",
    method: "GET",
    statusCode: 200,
    message: "Health check OK",
    durationMs: 2,
  });
}

for (const entry of errorEntries) {
  appendFileSync(LOGS_FILE, JSON.stringify(entry) + "\n");
}

// Set FORCE_ERROR=true in .env
let envContent = "";
if (existsSync(ENV_FILE)) {
  envContent = readFileSync(ENV_FILE, "utf-8");
  envContent = envContent.replace(/^FORCE_ERROR=.*$/m, "FORCE_ERROR=true");
  if (!envContent.includes("FORCE_ERROR")) {
    envContent += "\nFORCE_ERROR=true";
  }
} else {
  envContent = "DEMO_APP_PORT=3001\nFORCE_ERROR=true\n";
}
writeFileSync(ENV_FILE, envContent);

console.log(`Triggered incident: wrote ${errorEntries.length} error entries`);
console.log(`Set FORCE_ERROR=true in ${ENV_FILE}`);
console.log("\nThe /checkout endpoint will now return 500 errors.");
console.log("Use the TrueForge agent to investigate and fix.");
