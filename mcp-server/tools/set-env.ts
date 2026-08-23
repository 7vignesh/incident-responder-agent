import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ENV_FILE = join(__dirname, "..", "..", ".env");

export interface SetEnvResult {
  success: boolean;
  message: string;
  previousValue?: string;
}

/**
 * Sets an environment variable in the .env file and in the current process.
 * This is a DESTRUCTIVE action - requires human approval.
 * Only allows modifying FORCE_ERROR for safety.
 */
export function setEnvVar(key: string, value: string): SetEnvResult {
  const ALLOWED_KEYS = ["FORCE_ERROR"];

  if (!ALLOWED_KEYS.includes(key)) {
    return {
      success: false,
      message: `Cannot modify '${key}'. Only these keys are allowed: ${ALLOWED_KEYS.join(", ")}`,
    };
  }

  const previousValue = process.env[key];
  process.env[key] = value;

  // Also update .env file if it exists
  if (existsSync(ENV_FILE)) {
    let content = readFileSync(ENV_FILE, "utf-8");
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
    writeFileSync(ENV_FILE, content);
  }

  return {
    success: true,
    message: `Set ${key}=${value} (was: ${previousValue ?? "unset"})`,
    previousValue,
  };
}
