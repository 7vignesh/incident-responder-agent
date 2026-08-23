import { appendFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  endpoint: string;
  method: string;
  statusCode: number;
  message: string;
  error?: string;
  durationMs?: number;
}

const LOGS_DIR = join(__dirname, "..", "logs");
const LOGS_FILE = join(LOGS_DIR, "app.jsonl");

mkdirSync(LOGS_DIR, { recursive: true });

export function log(entry: Omit<LogEntry, "timestamp">): void {
  const full: LogEntry = { timestamp: new Date().toISOString(), ...entry };
  appendFileSync(LOGS_FILE, JSON.stringify(full) + "\n");
}

export function getLogsPath(): string {
  return LOGS_FILE;
}
