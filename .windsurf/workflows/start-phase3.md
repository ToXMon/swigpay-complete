---
description: Phase 3 — Full end-to-end demo agent + verify transaction log. Run /start-phase3 after Phase 2 is complete.
---

# Phase 3: Full E2E Demo Agent + Transaction Log (Hours 5-6)

Prerequisites: Phase 2 complete, Squads multisig provisioned, USDC in vault, MCP server running on :4022

## Step 1 — Make sure MCP server is running
```bash
# Terminal 1 (keep open)
pnpm server
```
Confirm you see: "✅ SwigPay MCP Server running on http://localhost:4022/mcp"

## Step 2 — Run the full demo agent
```bash
# Terminal 2
pnpm demo
```

Expected output in order:
```
🦞 SwigPay Demo Agent — OpenClaw Compatible
📋 Agent: <your agent address>
   Squads Vault: <your vault PDA>
   Daily limit: 1 USDC
   Per-tx limit: 0.01 USDC

📋 Available MCP tools (3):
   - ping: Health check (free)
   - solana_price: Get current SOL/USDC price...
   - account_info: Fetch Solana account data...

--- Test 1: Free tool (ping) ---
Result: "pong — SwigPay MCP Server is online"

--- Test 2: Paid tool (solana_price) ---
[x402] Payment requested:
[x402]   Amount: 0.001 USDC
[x402] ✅ Payment approved by spend policy
[x402] ✅ Payment confirmed:
[x402]   TxHash: <hash>
[x402]   🔗 https://explorer.solana.com/tx/<hash>?cluster=devnet

--- Test 3: Paid tool (account_info) ---
[x402] ✅ Payment confirmed: ...

--- Test 4: Spend limit rejection ---
Policy result for 10.0 USDC: approved=false
Reason: Per-tx limit exceeded: 10 USDC > 0.01 USDC max
✅ Spend limit correctly blocked the payment!
```

## Step 3 — If Test 2 fails (payment not going through)
Check these in order:
1. Is the vault PDA funded with USDC? Run: `pnpm fund-check`
2. Is the spending limit PDA set? Check: `SQUADS_SPENDING_LIMIT_PDA` in .env
3. Is `AGENT_PRIVATE_KEY_BASE58` the correct base58 key?
4. Try re-running provision: `pnpm provision`

## Step 4 — Verify the SQLite transaction log
```bash
node --input-type=module << 'EOF'
import Database from "better-sqlite3";
const db = new Database("./swigpay.db");
const rows = db.prepare("SELECT * FROM payments ORDER BY id DESC LIMIT 10").all();
console.table(rows);
EOF
```
You should see rows with status "approved" and a tx_hash for the paid tool calls.

## Step 5 — Copy the Explorer URL
From the demo output, copy the Solana Explorer URL for the payment transaction.
This goes in your README as proof of a live on-chain payment.
Example: `https://explorer.solana.com/tx/YOURHASH?cluster=devnet`

## Step 6 — Commit
```bash
git add -A
git commit -m "feat: [3.0] Full e2e demo working + SQLite payment log confirmed"
git push origin main
```

## Phase 3 COMPLETE when:
- [ ] `pnpm demo` runs all 4 tests without crashing
- [ ] At least 1 Solana Explorer URL showing confirmed USDC transfer
- [ ] `swigpay.db` has payment rows with status "approved"
- [ ] Spend limit rejection (Test 4) shows approved=false

Then run `/start-phase4` (or `/demo-prep` for final submission prep).
