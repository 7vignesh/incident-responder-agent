# Incident Responder Agent

A TrueForge-powered agent that detects, investigates, and remediates production incidents with a mandatory human-approval gate before any state-changing action.

Built for **The Agent Harness Hackathon** (WeMakeDevs x TrueFoundry x Qodo).

## Architecture

```
┌──────────────┐     ┌───────────────────────────┐     ┌──────────────┐
│  Demo App    │────>│  Custom MCP Server         │<────│  TrueForge   │
│  (Express)   │     │  - read_logs (read-only)   │     │  Agent Loop  │
│  port 3001   │     │  - check_health (read-only)│     │              │
│              │     │  - check_checkout (r/o)     │     │  Model:      │
│  Fault:      │     │  - set_env_var (approval)  │     │  OpenRouter  │
│  FORCE_ERROR │     │  - restart_service (appr.) │     │              │
└──────────────┘     └───────────────────────────┘     │  + GitHub MCP│
                                                        └──────────────┘
```

**Pipeline:** Detection → Investigation → Diagnosis → Proposal → Approval Gate → Execution → Verification

## Prerequisites

- Node.js >= 22.14 ([download](https://nodejs.org))
- npm (comes with Node.js)
- A free [OpenRouter](https://openrouter.ai) API key (sign up, no credit card needed)
- A [GitHub personal access token](https://github.com/settings/tokens) with `repo` scope (for commit history analysis)
- TrueForge: `npx @truefoundry/trueforge` (downloaded on first run, ~30s)

## Quick Start

### 1. Install dependencies

```bash
cd incident-responder-agent
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start TrueForge

```bash
npx @truefoundry/trueforge
```

Open http://localhost:8790 in your browser.

### 4. Configure TrueForge (first time only)

> Open http://localhost:8790 after starting TrueForge. All configuration is done in the web UI.

**Add OpenRouter as a model provider:**
1. Go to Settings → Models
2. Add provider: OpenAI-compatible
3. Name: `openrouter`
4. Base URL: `https://openrouter.ai/api/v1`
5. API Key: your OpenRouter key
6. Save

**Add the custom MCP server as a connector:**
1. Go to Settings → Connectors
2. Add connector: Stdio
3. Name: `incident-responder`
4. Command: `npx tsx <full-path-to-repo>/mcp-server/index.ts`
   - On Windows: `npx tsx D:\path\to\incident-responder-agent\mcp-server\index.ts`
   - On macOS/Linux: `npx tsx /path/to/incident-responder-agent/mcp-server/index.ts`
5. Save

**Add GitHub MCP server (optional, for commit analysis):**
1. Go to Settings → Connectors
2. Add connector: choose the GitHub MCP from the catalog, or:
   - Type: Stdio
   - Name: `github`
   - Command: `npx -y @modelcontextprotocol/server-github`
   - Environment: `GITHUB_PERSONAL_ACCESS_TOKEN=<your-token>`
3. Save

### 5. Create the agent

Either use the SDK script:

```bash
npm run setup-agent
```

Or create manually in the TrueForge UI using the spec in `trueforge/agent-spec.json`.

### 6. Run the demo

**Terminal 1 - Start the demo app:**
```bash
npm run demo-app
```

**Terminal 2 - Seed logs and trigger the incident:**
```bash
npm run seed-logs
npm run trigger-incident
```

**Terminal 3 - Use the agent:**
Open http://localhost:8790, select the `incident-responder` agent, and send:

> There's an incident affecting the checkout endpoint. Investigate and fix it.

### What happens next

1. The agent calls `check_checkout` - confirms 500 errors
2. Calls `read_logs` - sees the error pattern (PaymentProcessingError, every request)
3. Calls GitHub tools - checks recent commits for relevant changes
4. Reasons about root cause - correlates FORCE_ERROR with the error pattern
5. Proposes a fix - "Set FORCE_ERROR=false and restart the service"
6. **PAUSES FOR APPROVAL** - you see the proposed `set_env_var` call in the UI
7. You click **Allow** or **Deny**
8. If approved: executes the fix, restarts, verifies `/checkout` returns 200

## Project Structure

```
.
├── demo-app/
│   ├── server.ts          # Express app with fault injection
│   └── logger.ts          # Structured JSON logging
├── mcp-server/
│   ├── index.ts           # MCP server entry (stdio transport)
│   └── tools/
│       ├── read-logs.ts   # Log analysis (read-only)
│       ├── check-health.ts # Endpoint probing (read-only)
│       ├── set-env.ts     # Env var changes (requires approval)
│       ├── restart-service.ts # Service restart (requires approval)
│       ├── audit.ts       # Audit trail logging
│       └── get_audit_trail # Exposed as read-only MCP tool
├── trueforge/
│   ├── agent-spec.json    # Full agent definition
│   └── setup.ts           # SDK script to register agent
├── scripts/
│   ├── run-demo.ts        # Full demo orchestration
│   ├── seed-logs.ts       # Generate baseline log data
│   ├── trigger-incident.ts # Activate the fault
│   └── reset-incident.ts  # Deactivate the fault
├── logs/                   # App logs (gitignored)
├── audit/                  # Audit trail (gitignored)
└── README.md
```

## Judging Criteria Alignment

| Criterion | How we address it |
|-----------|-------------------|
| **Real tool access** | Custom MCP server with 5 tools; GitHub MCP for commit history |
| **Sandboxed execution** | Destructive tools isolated in MCP server; only FORCE_ERROR is writable |
| **Human approval gate** | `require_approval_for_tools` on `set_env_var` and `restart_service` |
| **Control and safety** | Full audit trail; read-only investigation; explicit rollback plan |
| **End-to-end demo** | One scenario, fully working: trigger → detect → fix → verify |

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run demo-app` | Start the Express demo app |
| `npm run mcp-server` | Start the MCP server standalone (for testing) |
| `npm run seed-logs` | Generate 30min of normal traffic logs |
| `npm run trigger-incident` | Activate FORCE_ERROR and write error logs |
| `npm run reset-incident` | Set FORCE_ERROR=false |
| `npm run setup-agent` | Register agent in TrueForge via SDK |
| `npm run setup-git` | Create demo git commit history |
| `npm run demo` | Full automated setup (seed + start + trigger) |

## Resetting

```bash
npm run reset-incident
# Restart the demo app
npm run demo-app
```

## License

MIT
