# Fake Commits for Demo

These represent the "recent commits" the GitHub MCP tool will find when investigating.
Push these as real commits to your repo for the demo to work end-to-end with GitHub MCP.

## Commit sequence to create:

### Commit 1 (oldest) - "normal" commit
```
feat: add /products endpoint

Added a products listing endpoint that returns the catalog.
```
Files changed: `demo-app/server.ts` (add the /products route)

### Commit 2 - "normal" commit
```
chore: add structured logging

All requests now write to logs/app.jsonl with timestamp, endpoint, status, duration.
```
Files changed: `demo-app/logger.ts` (new file)

### Commit 3 - THE BAD COMMIT
```
feat: add payment gateway timeout simulation for load testing

Added FORCE_ERROR env var that simulates payment gateway timeouts.
Set FORCE_ERROR=true in production to test monitoring alerts.
```
Files changed: `demo-app/server.ts` (add the FORCE_ERROR check in /checkout)

### Commit 4 - "config change" that enables the bug
```
chore: update production env defaults

Updated .env.example with load testing configuration.
Set FORCE_ERROR=true for overnight load test run.
```
Files changed: `.env` (FORCE_ERROR=false -> FORCE_ERROR=true)

---

## Why this matters

When the agent uses GitHub MCP to fetch recent commits, it will see:
1. Commit 4 changed FORCE_ERROR to true
2. Commit 3 introduced the FORCE_ERROR mechanism
3. The logs show PaymentProcessingError starting after these commits

This gives the agent clear evidence to correlate: "someone set FORCE_ERROR=true and that's
causing the checkout failures."
