import { execSync, spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface RestartResult {
  success: boolean;
  message: string;
}

/**
 * Restarts the demo app by killing the existing process and spawning a new one.
 * This is a DESTRUCTIVE action - requires human approval.
 */
export function restartService(env?: Record<string, string>): RestartResult {
  try {
    // Kill existing demo-app process on port 3001
    try {
      if (process.platform === "win32") {
        execSync(
          'for /f "tokens=5" %a in (\'netstat -ano ^| findstr :3001 ^| findstr LISTENING\') do taskkill /F /PID %a',
          { shell: "cmd.exe", stdio: "ignore" }
        );
      } else {
        execSync("lsof -ti:3001 | xargs kill -9 2>/dev/null || true", { stdio: "ignore" });
      }
    } catch {
      // Process might not be running, that's fine
    }

    // Start the demo app with provided env vars
    const demoAppPath = join(__dirname, "..", "..", "demo-app", "server.ts");
    const envVars = { ...process.env, ...env };
    const envString = Object.entries(env || {})
      .map(([k, v]) => `${k}=${v}`)
      .join(" ");

    // Spawn detached so MCP server doesn't wait for it
    const child = spawn("npx", ["tsx", demoAppPath], {
      env: envVars,
      stdio: "ignore",
      shell: true,
      detached: true,
      cwd: join(__dirname, "..", ".."),
    });
    child.unref();

    return {
      success: true,
      message: `Service restarted${envString ? ` with ${envString}` : ""}`,
    };
  } catch (err: any) {
    return { success: false, message: `Failed to restart: ${err.message}` };
  }
}
