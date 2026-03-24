---
description: Phase 4 — Next.js dashboard, README, demo video, submission. Run /start-phase4 after Phase 3 is complete.
---

# Phase 4: Dashboard + README + Demo Video + Submit (Hours 7-8)

Prerequisites: Phase 3 complete, all 4 demo tests passing, Explorer URL in hand

## Step 1 — Start the dashboard
```bash
# Terminal 3 (keep server + demo terminal open too)
pnpm dashboard
```
Open: http://localhost:3000

You should see:
- Agent card with vault PDA address (clickable Explorer link)
- Daily spend progress bar (should show some USDC spent from Phase 3)
- Transaction feed with the payments from pnpm demo
- No pending approvals (demo payments were under threshold)

## Step 2 — If dashboard has errors
Common fixes:
- Missing `@swigpay/agent-wallet` module: run `pnpm install` from root
- DB not found: make sure `DB_PATH=./swigpay.db` is in .env and you ran `pnpm demo` first
- Port conflict: change `DASHBOARD_PORT=3001` in .env and restart

## Step 3 — Test the Approve flow
To test the pending approval UI:
```bash
# Directly insert a pending payment into the DB
node --input-type=module << 'EOF'
import Database from "better-sqlite3";
const db = new Database("./swigpay.db");
db.prepare(`
  INSERT INTO payments (agent_id, tool, endpoint, amount_usdc, amount_raw, tx_hash, status, created_at, explorer_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  process.env.AGENT_ADDRESS ?? "demo-agent",
  "premium_data",
  "http://localhost:4022/mcp",
  0.75,
  750000,
  "",
  "pending_approval",
  new Date().toISOString(),
  ""
);
console.log("Inserted pending payment");
EOF
```
Refresh http://localhost:3000 — you should see the yellow "Pending Approvals" section with Approve/Reject buttons.

## Step 4 — Write the README
Open `README.md` and fill in the two placeholder values:
- `DEMO_TX_HASH` → replace with the actual tx hash from `pnpm demo` output
- `DEMO_MULTISIG_PDA` → replace with `SQUADS_MULTISIG_PDA` from your .env

The README already has the correct structure for dual bounty claims.

## Step 5 — Record the 3-minute demo video
Use Loom, QuickTime, or OBS. Follow this exact script:

| Time | What to show |
|------|-------------|
| 0:00–0:15 | GitHub repo README — scroll to show Bounty 1 + Bounty 3 claims |
| 0:15–0:45 | Terminal 1: `pnpm server` output — "ResourceServer initialized" |
| 0:45–1:30 | Terminal 2: `pnpm demo` — show [x402] payment confirmed + Explorer URL |
| 1:30–2:00 | Browser: paste Explorer URL — show USDC transfer confirmed on devnet |
| 2:00–2:30 | Browser: localhost:3000 — show agent card, transaction feed, approve button |
| 2:30–3:00 | Terminal 2: Test 4 output — "Spend limit correctly blocked the payment!" |

End with: "SwigPay — the missing infrastructure layer for AI agents on Solana."

## Step 6 — Upload video
- YouTube (unlisted): upload, copy link
- OR Loom: copy share link
- OR Google Drive (link sharing on): copy link

## Step 7 — Final git push
```bash
git add -A
git commit -m "docs: README + demo video ready — Penn Blockchain Hackathon submission"
git push origin main
```

## Step 8 — Submit on Devfolio
Fill out submission form with:
- **Project name:** SwigPay
- **GitHub URL:** your repo URL
- **Demo video:** your Loom/YouTube link
- **Bounty 1:** ✅ Best Use of Agentic Payments on Solana with x402
- **Bounty 3:** ✅ Smart Account Provisioning for OpenClaw Agents
- **Description:** "SwigPay provisions OpenClaw AI agents with Squads v4 multisig smart accounts on Solana enforcing spend limits, while letting agents autonomously pay for MCP tools via x402 USDC micropayments. Human oversight dashboard included."

## Final Checklist (do NOT submit until all checked)
- [ ] `pnpm install && pnpm server` works from clean checkout
- [ ] `pnpm demo` shows at least 1 confirmed USDC Explorer link
- [ ] http://localhost:3000 loads and shows transaction feed
- [ ] README has real tx hash and real multisig PDA (not placeholders)
- [ ] `.env` is in `.gitignore` (check: `cat .gitignore`)
- [ ] `.env.example` is committed with no real keys
- [ ] GitHub repo is **PUBLIC**
- [ ] Demo video is uploaded with working link
- [ ] Devfolio submission references **BOTH** Bounty 1 AND Bounty 3

**DEADLINE: March 27, 2026 at 6:00 PM ET**
