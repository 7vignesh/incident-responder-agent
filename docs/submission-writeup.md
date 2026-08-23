# Incident Responder Agent - Submission Write-up

## What It Does

An AI agent that detects a production incident, investigates root cause using logs and git history, proposes a fix, and **pauses for human approval** before executing any state-changing action. Built on TrueForge, the open-source agent harness.

## TrueForge Features Used

### 1. MCP Tool Integration (Custom Server)
Built a stdio-based MCP server with 6 tools spanning read-only investigation and gated execution. TrueForge discovers and exposes these to the agent via its connector system.

### 2. Tool Annotations (`readOnlyHint` / `destructiveHint`)
Every tool declares its safety profile via MCP annotations. TrueForge uses these to automatically determine which tools need human sign-off.

### 3. `require_approval_for_tools: ["@destructive"]`
The agent spec uses TrueForge's annotation-based selector to gate all tools marked `destructiveHint: true`. The harness pauses execution, shows the tool call to the user, and waits for Allow/Deny.

### 4. Human-in-the-Loop Approval Gate
The single most important feature. The agent physically cannot call `set_env_var` or `restart_service` without explicit user consent in the TrueForge UI. This is enforced at the harness level, not by prompt engineering alone.

### 5. Agent Spec (Declarative Configuration)
The full agent behavior is defined in one JSON spec: model, MCP servers, tool policies, capabilities, and iteration limits. Reproducible and version-controlled.

### 6. OpenRouter Integration (Free-tier Models)
Configured as an OpenAI-compatible provider, using `qwen/qwen3-coder-480b:free` for the agent loop at zero cost.

## Architecture

```
Demo App (Express, port 3001)
  └─ FORCE_ERROR env var controls fault injection
  └─ Writes structured logs to logs/app.jsonl

MCP Server (stdio)
  └─ 4 read-only tools (safe, no gate)
  └─ 2 destructive tools (gated by TrueForge approval)
  └─ Audit trail logged to audit/incident-YYYY-MM-DD.json

TrueForge Harness
  └─ Runs agent loop with model calls
  └─ Manages MCP connections
  └─ Enforces approval policy via tool annotations
  └─ Exposes chat UI for human interaction

GitHub MCP (catalog server)
  └─ Provides read-only access to commit history
  └─ Agent correlates recent changes with error patterns
```

## Pipeline Phases

| Phase | Tools Used | Gate |
|-------|-----------|------|
| Detection | check_health, check_checkout | None (read-only) |
| Investigation | read_logs, GitHub MCP | None (read-only) |
| Diagnosis | LLM reasoning | None |
| Proposal | LLM output | None |
| Execution | set_env_var, restart_service | **Human approval required** |
| Verification | check_checkout | None (read-only) |
| Report | get_audit_trail | None (read-only) |

## Judging Criteria

| Criterion | Evidence |
|-----------|----------|
| Real tool access | Custom MCP server, GitHub MCP - actual protocol calls, not mocked |
| Sandboxed execution | Destructive tools isolated in MCP server; only FORCE_ERROR writable |
| Human approval gate | `@destructive` annotation selector; harness-enforced, not prompt-only |
| Control and safety | Full timestamped audit trail; read-only investigation phase |
| Demo quality | One scenario, fully E2E: trigger -> detect -> fix -> verify |
