import { appendFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Seeds the log file with realistic "normal" traffic entries
 * so the agent has baseline data to compare against errors.
 */
const LOGS_DIR = join(__dirname, "..", "logs");
const LOGS_FILE = join(LOGS_DIR, "app.jsonl");

mkdirSync(LOGS_DIR, { recursive: true });

const now = Date.now();
const entries = [];

// Generate 30 minutes of normal traffic before the incident
for (let i = 60; i >= 1; i--) {
  const ts = new Date(now - i * 30_000).toISOString(); // every 30s

  // Health checks
  entries.push({
    timestamp: ts,
    level: "info",
    endpoint: "/health",
    method: "GET",
    statusCode: 200,
    message: "Health check OK",
    durationMs: Math.floor(Math.random() * 5) + 1,
  });

  // Occasional product listings
  if (i % 3 === 0) {
    entries.push({
      timestamp: ts,
      level: "info",
      endpoint: "/products",
      method: "GET",
      statusCode: 200,
      message: "Listed products",
      durationMs: Math.floor(Math.random() * 10) + 2,
    });
  }

  // Checkout requests - all successful
  if (i % 5 === 0) {
    entries.push({
      timestamp: ts,
      level: "info",
      endpoint: "/checkout",
      method: "POST",
      statusCode: 200,
      message: "Checkout processed successfully",
      durationMs: Math.floor(Math.random() * 50) + 20,
    });
  }
}

// Write all entries
for (const entry of entries) {
  appendFileSync(LOGS_FILE, JSON.stringify(entry) + "\n");
}

console.log(`Seeded ${entries.length} log entries to ${LOGS_FILE}`);
