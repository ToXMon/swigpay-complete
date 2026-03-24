---
description: Final 2 hours — README, demo video, submission. Run /demo-prep before deadline.
---

# Demo Prep (Run 2 Hours Before 6 PM ET Deadline)

## Step 1 — Verify Everything Works

```bash
# Terminal 1: MCP server
pnpm server

# Terminal 2: Run full demo
pnpm demo
```

Screenshot the terminal showing:
- "[x402] Payment confirmed" with tx hash
- Explorer URL for the USDC transfer

## Step 2 — Generate README

Write README.md with these exact sections:

```markdown
# SwigPay — OpenClaw Agent Smart Wallets on Solana

> Penn Blockchain Conference Hackathon 2026

## What This Is
[One paragraph: problem + solution]

## Bounty 1 Claim — Best Use of Agentic Payments on Solana with x402
[Explain: OpenClaw agent calls paid MCP tools → HTTP 402 fired → USDC payment
via @x402/mcp + @x402/svm → Squads vault pays server → 200 response]
[Include: live Solana Explorer link from demo]

## Bounty 3 Claim — Smart Account Provisioning for OpenClaw Agents
[Explain: Squads v4 multisig provisioned for agent, spending limit enforced,
human override dashboard, spend limit rejection demo]
[Include: Squads multisig PDA on Explorer]

## Architecture
[Paste ASCII diagram from AGENTS.md]

## Quick Start
\`\`\`bash
pnpm install
cp .env.example .env
# Fill in keys, airdrop SOL, get USDC from faucet.circle.com
pnpm provision   # create Squads wallet
pnpm server      # start MCP server (terminal 1)
pnpm demo        # run agent demo (terminal 2)
pnpm dashboard   # open dashboard (terminal 3)
\`\`\`
```

## Step 3 — Demo Video (3 min)

1. (0:00-0:20) Show GitHub repo + README dual bounty claims
2. (0:20-0:50) Terminal: `pnpm server` → server starts → "ResourceServer initialized"
3. (0:50-1:30) Terminal: `pnpm demo` → payment requested → confirmed → Explorer URL
4. (1:30-2:00) Open Solana Explorer: show USDC transfer confirmed on devnet
5. (2:00-2:30) Show spend limit rejection (Test 4 output in terminal)
6. (2:30-3:00) Open dashboard localhost:3000 → show transaction feed + agent wallet

## Step 4 — Final Checklist

- [ ] `pnpm install && pnpm server` works from clean checkout
- [ ] `pnpm demo` completes with Explorer link visible
- [ ] README has BOTH bounty claim sections
- [ ] .env.example committed (no real keys in git)
- [ ] GitHub repo is PUBLIC
- [ ] Demo video uploaded (YouTube unlisted or Loom)

## Step 5 — Submit

```bash
git add -A
git commit -m "docs: final README + submission prep"
git push origin main
```

Submit on Devfolio:
- GitHub URL
- Demo video link
- Tag: Bounty 1 AND Bounty 3
