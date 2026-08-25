# AGENTS.md

## Project: Incident Responder Agent

**Hackathon:** The Agent Harness Hackathon (WeMakeDevs x TrueFoundry x Qodo)
**Repo:** https://github.com/7vignesh/incident-responder-agent

## What This Is

An AI agent running on TrueForge that detects a production incident in a demo Express app, investigates root cause using logs and git history, proposes a fix, and pauses for human approval before executing any state-changing action.

## Stack

- **Runtime:** TrueForge (`npx @truefoundry/trueforge`) - the agent harness
- **Language:** TypeScript/Node.js (ESM)
- **Package manager:** npm
- **Model:** OpenRouter (OpenAI-compatible), free-tier models
- **Tools:** Custom MCP server (6 tools), GitHub MCP (optional)
- **Demo app:** Express API with fault injection

## Architecture

```
Demo App (Express, port 3001)
  - FORCE_ERROR env var controls fault injection
  - Writes structured logs to logs/app.jsonl

MCP Server (HTTP, port 3002)
  - 4 read-only tools: check_health, check_checkout, read_logs, get_audit_trail
  - 2 destructive tools (gated): set_env_var, restart_service
  - Tool annotations: readOnlyHint/destructiveHint for TrueForge selectors

TrueForge Harness
  - Runs agent loop (model + tools)
  - Enforces human approval on @destructive tools
  - Exposes chat UI at http://localhost:8790

Agent Pipeline: Detection -> Investigation -> Diagnosis -> Proposal -> Approval Gate -> Execution -> Verification
```

## Commands

| Command | What it does |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run demo-app` | Start Express demo app (port 3001) |
| `npm run mcp-server-http` | Start MCP server with HTTP transport (port 3002) |
| `npm run mcp-server` | Start MCP server with stdio transport |
| `npm run seed-logs` | Generate 30min of normal traffic logs |
| `npm run trigger-incident` | Activate FORCE_ERROR + write error logs |
| `npm run reset-incident` | Set FORCE_ERROR=false |
| `npm run setup-agent` | Register agent in TrueForge via SDK |
| `npm run build` | TypeScript compile |

## Layout

```
demo-app/
  server.ts          - Express API with fault injection
  logger.ts          - Structured JSON logger

mcp-server/
  index.ts           - MCP server (stdio transport)
  http-server.ts     - MCP server (HTTP/StreamableHTTP transport, port 3002)
  tools/
    read-logs.ts     - Log analysis (read-only)
    check-health.ts  - Endpoint probing (read-only)
    set-env.ts       - Env var mutation (destructive, gated)
    restart-service.ts - Process restart (destructive, gated)
    audit.ts         - Audit trail logging

trueforge/
  agent-spec.json    - Full agent definition (model, tools, instructions, approval policy)
  setup.ts           - SDK script to register agent programmatically

scripts/
  seed-logs.ts       - Generate baseline log data
  trigger-incident.ts - Activate fault + write error entries
  reset-incident.ts  - Deactivate fault
  run-demo.ts        - Full automated orchestration
  setup-git-history.ts - Create meaningful commit history

docs/
  demo-commits.md    - Git history plan for demo
  demo-script.md     - 3-minute recording script
  submission-writeup.md - Hackathon submission write-up

logs/               - App logs (gitignored, .jsonl)
audit/              - Audit trail (gitignored, .json)
```

## Key Files to Understand

- `trueforge/agent-spec.json` - The agent definition: model, MCP servers, approval policy, instructions
- `mcp-server/http-server.ts` - The MCP server TrueForge connects to via URL
- `mcp-server/tools/` - Each tool is a separate module with clear input/output
- `demo-app/server.ts` - The thing that breaks (FORCE_ERROR=true -> 500 on /checkout)

## TrueForge Configuration

### Model Provider (Settings -> Models)
- Type: OpenAI Compatible
- Name: `openrouter`
- Base URL: `https://openrouter.ai/api/v1`
- API Key: OpenRouter API key
- Model ID: a free model from openrouter.ai/models (filter by free, needs tool/function calling support)

### MCP Connector (Settings -> Connectors -> Add MCP Server)
- Auth type: None
- Name: `incident-responder`
- URL: `http://localhost:3002/mcp`

### Agent Spec Key Points
- `require_approval_for_tools: ["@destructive"]` - gates tools annotated with `destructiveHint: true`
- `enable_tools: ["@all"]` - exposes all tools from the MCP server
- `iteration_limit: 30` - prevents runaway loops
- Instructions enforce a 6-phase pipeline

## Hackathon Judging Criteria

| Criterion | How we address it |
|-----------|-------------------|
| Real tool access | Custom MCP server with 6 tools; stdio + HTTP transport |
| Sandboxed execution | Destructive tools isolated in MCP; only FORCE_ERROR writable |
| Human approval gate | `@destructive` annotation selector; harness-enforced |
| Control and safety | Full timestamped audit trail; read-only investigation phase |
| End-to-end demo | One scenario, fully working: trigger -> detect -> fix -> verify |

## Current Status

- [x] Demo app with fault injection
- [x] Custom MCP server (stdio + HTTP)
- [x] Tool annotations (readOnlyHint/destructiveHint)
- [x] TrueForge agent spec with approval gate
- [x] Audit trail logging
- [x] Scripts for seeding, triggering, resetting
- [x] Git history with incremental commits
- [x] GitHub repo public: https://github.com/7vignesh/incident-responder-agent
- [x] 3 PRs created and reviewed by Qodo
- [x] README with setup instructions
- [ ] E2E test with live TrueForge (blocked on model ID - need correct free model from OpenRouter)
- [ ] Demo recording

## Known Issues

1. **Model ID:** `qwen/qwen3-coder-480b:free` may not be valid on OpenRouter anymore. Go to https://openrouter.ai/models, filter free, find one that supports tool use, use that exact ID.
2. **Windows port conflicts:** Port 3001 gets stuck. Use `netstat -ano | findstr :3001` then `taskkill /F /PID <pid>` to free it.
3. **Git Bash path mangling:** Use `MSYS_NO_PATHCONV=1` prefix for commands with `/` arguments (e.g., gh pr comment).
4. **TrueForge on Windows:** May fail with path error. Run TrueForge in WSL: `wsl` then `npx @truefoundry/trueforge`.

## How to Run the Full Demo

Terminal 1 (WSL):
```bash
npx @truefoundry/trueforge
```

Terminal 2:
```bash
cd D:/projects/agent_harness
npm run seed-logs
npm run trigger-incident
FORCE_ERROR=true npx tsx demo-app/server.ts
```

Terminal 3:
```bash
cd D:/projects/agent_harness
npx tsx mcp-server/http-server.ts
```

Then in TrueForge UI (http://localhost:8790):
1. Select the incident-responder agent
2. Send: "There's an incident affecting the checkout endpoint. Investigate and fix it."
3. Watch it detect -> investigate -> diagnose -> propose
4. Approve or deny when prompted
5. See verification + audit trail

## Conventions

- ESM modules (`"type": "module"` in package.json)
- Imports use `fileURLToPath(import.meta.url)` for __dirname equivalent
- Tool annotations follow MCP spec: `readOnlyHint`, `destructiveHint`, `idempotentHint`
- Audit entries: `{ timestamp, phase, action, details, outcome }`
- Log entries: `{ timestamp, level, endpoint, method, statusCode, message, error?, durationMs? }`
