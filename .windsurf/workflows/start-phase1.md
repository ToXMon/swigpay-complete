---
description: Phase 1 — Bootstrap project and get MCP server returning HTTP 402. Run /start-phase1 to begin.
---

# Phase 1: MCP Server + x402 Setup (Hours 1-2)

1. Verify the project structure exists. If not, create it from AGENTS.md directory map.

2. Run pnpm install from project root:
   ```bash
   pnpm install
   ```
   If pnpm not installed: `npm install -g pnpm`

3. Copy .env.example to .env:
   ```bash
   cp .env.example .env
   ```

4. Generate wallets if not done:
   ```bash
   pnpm setup
   ```
   Copy output into .env

5. Start the MCP server:
   ```bash
   pnpm server
   ```

6. Verify HTTP 402 is returned (in a new terminal):
   ```bash
   # Health check (free — should return 200)
   curl http://localhost:4022/health

   # This should return x402 payment error (tool requires payment)
   curl -X POST http://localhost:4022/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
   ```

7. Phase 1 is COMPLETE when:
   - `curl http://localhost:4022/health` returns 200 with tool list
   - Server logs show "x402 ResourceServer initialized"
   - Commit: `git add -A && git commit -m "feat: [1.0] MCP server with x402 payment gates"`

8. Say "phase 1 complete" and move to /start-phase2
