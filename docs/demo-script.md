# Demo Recording Script (Under 3 Minutes)

## Pre-recording Setup (do before hitting record)
```bash
npm run reset-incident     # ensure clean state
rm -f logs/app.jsonl audit/incident-*.json
npm run seed-logs          # baseline traffic
npm run demo-app           # start app (shows FORCE_ERROR=false)
```
Confirm: `curl http://localhost:3001/checkout -X POST` returns 200.

Start TrueForge: `npx @truefoundry/trueforge` (already configured with connectors + agent).

---

## Recording Script

### 0:00-0:20 - Set the scene
- Show terminal: "This is a demo Express e-commerce API running normally."
- Quick curl to `/checkout` showing 200 OK response.
- "Now let's simulate a production incident."

### 0:20-0:40 - Trigger the incident
- Run: `npm run trigger-incident`
- Show output: "FORCE_ERROR=true, /checkout returning 500 errors"
- Quick curl to `/checkout` - show the 500 PaymentProcessingError response.
- "Our checkout is down. Let's ask the agent to handle this."

### 0:40-1:30 - Agent investigation (linger on TrueForge UI)
- Switch to TrueForge UI (http://localhost:8790)
- Type: "There's an incident affecting checkout. Investigate and fix it."
- Show agent calling `check_checkout` - sees 500
- Show agent calling `read_logs` - sees error pattern
- Show agent calling GitHub tools - sees recent commits
- Show the diagnosis output (correlating FORCE_ERROR with the errors)
- "The agent found the root cause: FORCE_ERROR was set to true in a recent config change."

### 1:30-2:10 - THE APPROVAL GATE (most important part)
- Show the agent's remediation proposal text
- **Linger on the approval prompt** - highlight Allow/Deny buttons
- "The agent CANNOT proceed without my explicit approval. Watch:"
- Click **Allow**
- Show `set_env_var` executing
- Show `restart_service` executing (second approval prompt)
- Click **Allow** again

### 2:10-2:40 - Verification
- Show agent calling `check_checkout` again - now returns 200
- Show the agent's final report (timestamps, phases, resolution)
- Quick terminal: `curl http://localhost:3001/checkout` - 200 confirmed

### 2:40-3:00 - Audit trail
- Show agent calling `get_audit_trail`
- Highlight: every phase logged with timestamps
- "Full audit trail of detection through resolution, all gated by human approval."
- End.

---

## Key Points to Emphasize for Judges
1. **Real MCP tools** - not simulated, actual stdio protocol calls
2. **The gate actually blocks** - agent cannot auto-execute under any code path
3. **Tool annotations drive the gate** - `destructiveHint: true` triggers TrueForge's approval
4. **Audit trail** - every action timestamped for compliance/credibility
5. **Read-only investigation** - investigation tools physically cannot modify state

## If Something Goes Wrong
- Agent skips phases: restart session, the instructions force ordering
- Approval doesn't show: check agent spec has `@destructive` in require_approval_for_tools
- Model hallucinates: use a different free model (deepseek/deepseek-r1:free as backup)
