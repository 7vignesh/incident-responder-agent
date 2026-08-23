import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Resets the incident: sets FORCE_ERROR=false.
 */
const ENV_FILE = join(__dirname, "..", ".env");

if (existsSync(ENV_FILE)) {
  let content = readFileSync(ENV_FILE, "utf-8");
  content = content.replace(/^FORCE_ERROR=.*$/m, "FORCE_ERROR=false");
  writeFileSync(ENV_FILE, content);
  console.log("Reset: FORCE_ERROR=false");
} else {
  writeFileSync(ENV_FILE, "DEMO_APP_PORT=3001\nFORCE_ERROR=false\n");
  console.log("Created .env with FORCE_ERROR=false");
}

console.log("Restart the demo app to apply changes.");
