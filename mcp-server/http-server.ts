import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "http";
import { z } from "zod";
import { readLogs } from "./tools/read-logs.js";
import { checkHealth, checkCheckout } from "./tools/check-health.js";
import { restartService } from "./tools/restart-service.js";
import { setEnvVar } from "./tools/set-env.js";
import { logAudit, getAuditPath } from "./tools/audit.js";
import { readFileSync, existsSync } from "fs";

const MCP_PORT = parseInt(process.env.MCP_PORT || "3002", 10);

function createMcpServer() {
  const server = new McpServer({
    name: "incident-responder",
    version: "0.1.0",
  });

  // --- Read-only tools (no approval needed) ---

  server.registerTool(
    "read_logs",
    {
      description: "Read the last N log entries from the demo app and return a summary with error breakdown, frequencies, and recent errors.",
      inputSchema: { lines: z.number().optional().describe("Number of recent log lines to analyze (default 100)") },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async ({ lines }) => {
      const summary = readLogs(lines ?? 100);
      logAudit({ phase: "investigation", action: "read_logs", details: { lines: lines ?? 100 }, outcome: "success" });
      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    }
  );

  server.registerTool(
    "check_health",
    {
      description: "Check if the demo app /health endpoint is responding.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async () => {
      const result = await checkHealth();
      logAudit({ phase: "detection", action: "check_health", details: result, outcome: result.reachable ? "success" : "failure" });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    "check_checkout",
    {
      description: "Test the /checkout endpoint to see if it's working or returning errors.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async () => {
      const result = await checkCheckout();
      logAudit({
        phase: "detection",
        action: "check_checkout",
        details: result,
        outcome: result.statusCode === 200 ? "success" : "failure",
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    "get_audit_trail",
    {
      description: "Read the full audit trail for the current incident investigation. Shows every action taken, decisions made, and approvals granted.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async () => {
      const auditPath = getAuditPath();
      if (!existsSync(auditPath)) {
        return { content: [{ type: "text", text: "No audit entries yet." }] };
      }
      const content = readFileSync(auditPath, "utf-8");
      return { content: [{ type: "text", text: content }] };
    }
  );

  // --- Destructive tools (require human approval via TrueForge) ---

  server.registerTool(
    "set_env_var",
    {
      description: "Set an environment variable for the demo app. Currently only FORCE_ERROR is allowed. This is a WRITE operation that changes application state.",
      inputSchema: {
        key: z.string().describe("Environment variable name (only FORCE_ERROR allowed)"),
        value: z.string().describe("Value to set"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    },
    async ({ key, value }) => {
      const result = setEnvVar(key, value);
      logAudit({
        phase: "execution",
        action: "set_env_var",
        details: { key, value, result },
        outcome: result.success ? "success" : "failure",
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    "restart_service",
    {
      description: "Restart the demo app service, optionally with new environment variables. This is a DESTRUCTIVE operation that causes brief downtime.",
      inputSchema: {
        env: z.record(z.string()).optional().describe("Environment variables to set on restart"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
    },
    async ({ env }) => {
      const result = restartService(env ?? undefined);
      logAudit({
        phase: "execution",
        action: "restart_service",
        details: { env, result },
        outcome: result.success ? "success" : "failure",
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  return server;
}

async function main() {
  const mcpServer = createMcpServer();

  const httpServer = createServer(async (req, res) => {
    // CORS headers for TrueForge
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Mcp-Session-Id");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Create a new transport for each connection
    const transport = new StreamableHTTPServerTransport();
    await mcpServer.connect(transport);

    // Handle the request through the transport
    await transport.handleRequest(req, res);
  });

  httpServer.listen(MCP_PORT, () => {
    console.log(`Incident Responder MCP server running on http://localhost:${MCP_PORT}/mcp`);
    console.log("Use this URL in TrueForge connector settings.");
  });
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
