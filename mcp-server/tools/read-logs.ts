import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const LOGS_FILE = join(__dirname, "..", "..", "logs", "app.jsonl");

export interface LogSummary {
  totalEntries: number;
  errors: number;
  warnings: number;
  timeRange: { from: string; to: string } | null;
  errorBreakdown: Record<string, number>;
  avgResponseTimeMs: number | null;
  p95ResponseTimeMs: number | null;
  recentErrors: Array<{
    timestamp: string;
    endpoint: string;
    message: string;
    error?: string;
  }>;
}

export function readLogs(lines: number = 100): LogSummary {
  if (!existsSync(LOGS_FILE)) {
    return {
      totalEntries: 0,
      errors: 0,
      warnings: 0,
      timeRange: null,
      errorBreakdown: {},
      avgResponseTimeMs: null,
      p95ResponseTimeMs: null,
      recentErrors: [],
    };
  }

  const content = readFileSync(LOGS_FILE, "utf-8");
  const allLines = content.trim().split("\n").filter(Boolean);
  const recent = allLines.slice(-lines);
  const entries = recent.map((l) => JSON.parse(l));

  const errors = entries.filter((e) => e.level === "error");
  const warnings = entries.filter((e) => e.level === "warn");

  const errorBreakdown: Record<string, number> = {};
  for (const err of errors) {
    const key = `${err.endpoint} - ${err.error || err.message}`;
    errorBreakdown[key] = (errorBreakdown[key] || 0) + 1;
  }

  // Response time statistics
  const durations = entries
    .filter((e) => typeof e.durationMs === "number")
    .map((e) => e.durationMs as number);
  const avgResponseTimeMs = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;
  const p95ResponseTimeMs = durations.length > 0
    ? durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)]
    : null;

  return {
    totalEntries: entries.length,
    errors: errors.length,
    warnings: warnings.length,
    timeRange: entries.length > 0
      ? { from: entries[0].timestamp, to: entries[entries.length - 1].timestamp }
      : null,
    errorBreakdown,
    avgResponseTimeMs,
    p95ResponseTimeMs,
    recentErrors: errors.slice(-10).map((e) => ({
      timestamp: e.timestamp,
      endpoint: e.endpoint,
      message: e.message,
      error: e.error,
    })),
  };
}
