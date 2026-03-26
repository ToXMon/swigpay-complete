# SwigPay

> OpenClaw AI Agent Smart Wallets with x402 Autonomous Payments on Solana

**Penn Blockchain Conference Hackathon 2026**

---

## Bounty Claims

### Bounty 1: Best Use of Agentic Payments on Solana with x402 — $1,000

OpenClaw agents call paid MCP tools → HTTP 402 fires with USDC payment requirements → agent auto-pays via `@x402/mcp` + `@x402/svm` → USDC transfers on Solana devnet in ~400ms → server returns 200 with data. End-to-end agentic payment with no human intervention.

**Live tx (demo):** https://explorer.solana.com/tx/Yav8hnUKox2yLQrAoeAQYeRcJXEhpDANDDyUK3bkGQXCmHDBxzDp1E589gbwoQUc6UwtYJKaXdBE5rJ7gMqwed1?cluster=devnet

### Bounty 3: Smart Account Provisioning for OpenClaw Agents — $1,000

Squads v4 multisig provisioned per OpenClaw agent. Agent keypair is a 1-of-2 member with `Initiate + Execute` permissions. Spending limit enforced on-chain via `multisigAddSpendingLimit` — agent cannot exceed daily USDC limit even if compromised. Human operator has `Permissions.all()` as the second member. Next.js dashboard shows all payments, pending approvals, and spend controls.

**Squads multisig:** https://explorer.solana.com/address/CoxTuxnXNACKWZx2VHw2ekUFgUJC1YUm4nmHGML4oRKJ?cluster=devnet

---

## Architecture

```
HUMAN DASHBOARD (Next.js :3000)
  └── configure spend limits, view txns, approve over-threshold

OPENCLAW AGENT (agents/demo.ts)
  └── MCP client → calls paid tools → 402 fired
      → spend policy check → Squads vault pays USDC → tool returns data

MCP SERVER (apps/mcp-server :4022)
  └── @x402/mcp createPaymentWrapper protects: solana_price, account_info

SQUADS V4 SMART ACCOUNT
  └── 1-of-2 multisig: agent (Initiate+Execute) + human (all)
  └── spendingLimitPda: 1 USDC/day max from vault

SOLANA DEVNET
  └── USDC: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
  └── x402 Facilitator: https://x402.org/facilitator
```

---

## Quick Start

```bash
# 1. Install
pnpm install

# 2. Setup wallets
cp .env.example .env
pnpm setup          # generates keypairs, prints env values
# Paste output into .env

# 3. Fund wallets
solana airdrop 2 <AGENT_ADDRESS> --url devnet
solana airdrop 2 <HUMAN_ADDRESS> --url devnet
solana airdrop 2 <SERVER_ADDRESS> --url devnet
# Get USDC: https://faucet.circle.com → Solana Devnet → AGENT_ADDRESS

# 4. Provision Squads wallet
pnpm provision      # creates multisig + spending limit, prints PDAs
# Copy SQUADS_* values into .env

# 5. Run (3 terminals)
pnpm server         # MCP server on :4022
pnpm demo           # Agent demo (after server is up)
pnpm dashboard      # Dashboard on :3000
```

---

## Tech Stack

- `@x402/mcp` + `@x402/svm` v2.5 — x402 payments on Solana
- `@sqds/multisig` v2.1.4 — Squads v4 smart accounts
- `@modelcontextprotocol/sdk` v1.27 — MCP server + client
- `@solana/kit` v6 — Solana keypair signing
- Next.js 15 — Dashboard
- better-sqlite3 — Transaction log

---

Built for Penn Blockchain Conference Hackathon 2026.
