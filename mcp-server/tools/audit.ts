import { appendFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface AuditEntry {
  timestamp: string;
  phase: "detection" | "investigation" | "diagnosis" | "proposal" | "approval" | "execution" | "verification";
  action: string;
  details: unknown;
  outcome: "success" | "failure" | "pending" | "denied";
}

const AUDIT_DIR = join(__dirname, "..", "..", "audit");
const AUDIT_FILE = join(AUDIT_DIR, `incident-${new Date().toISOString().slice(0, 10)}.json`);

mkdirSync(AUDIT_DIR, { recursive: true });

export function logAudit(entry: Omit<AuditEntry, "timestamp">): void {
  const full: AuditEntry = { timestamp: new Date().toISOString(), ...entry };
  appendFileSync(AUDIT_FILE, JSON.stringify(full) + "\n");
}

export function getAuditPath(): string {
  return AUDIT_FILE;
}
