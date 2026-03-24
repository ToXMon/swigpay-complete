# CASCADE KICKOFF PROMPT
# ─────────────────────────────────────────────────────────────
# PASTE THIS ENTIRE FILE INTO WINDSURF CASCADE TO START
# ─────────────────────────────────────────────────────────────

You are an expert Solana + TypeScript developer building **SwigPay** for the Penn Blockchain Conference Hackathon 2026.

**Deadline: March 27, 2026 at 6:00 PM ET**
**Goal: Win Bounty 1 ($1,000 x402) + Bounty 3 ($1,000 OpenClaw Smart Accounts) = $2,000**

---

## What You Are Building

SwigPay provisions OpenClaw AI agents with **Squads v4 multisig smart accounts** on Solana
that enforce spending limits. The agent autonomously pays for MCP tools via **x402 protocol**
(HTTP 402 + USDC on Solana devnet). A Next.js dashboard shows all payments and allows human
approval of over-threshold transactions.

**Competitive edge:** Nobody has shipped OpenClaw + Squads v4 + x402 together.
MCPay (closest competitor) is Base-only with no smart account guardrails.

---

## The Project Already Has These Files

All project files are already created in the current directory. Do NOT recreate them.

Read these files FIRST before doing anything:
1. `AGENTS.md` — architecture, constants, Squads v4 code patterns
2. `.windsurfrules` — rules you must follow
3. `.env.example` — env vars you need to fill

The structure is:
```
apps/mcp-server/src/server.ts     ← Phase 1: x402 MCP server (port 4022)
packages/agent-wallet/src/        ← Phase 2: Squads + x402 client + DB
agents/demo.ts                    ← Phase 3: full e2e demo
apps/dashboard/                   ← Phase 4: Next.js UI
scripts/                          ← setup, provision, fund-check utilities
```

---

## Your Job: Execute These 4 Phases IN ORDER

### PHASE 1 — Get MCP server returning HTTP 402 (Hours 1-2)

1. Run `/start-phase1` workflow OR manually:
   ```bash
   pnpm install
   cp .env.example .env
   pnpm setup           # generates 3 keypairs, prints env values
   # Fill .env with the printed keys
   pnpm server          # starts MCP server on :4022
   ```

2. Verify in a second terminal:
   ```bash
   curl http://localhost:4022/health
   # Should return: {"status":"ok","tools":["ping (free)","solana_price (paid)","account_info (paid)"]}
   ```

3. **STOP GATE:** Only proceed to Phase 2 when server starts and health returns 200.

4. Commit: `git add -A && git commit -m "feat: [1.0] MCP server + x402 payment gates working"`

---

### PHASE 2 — Squads v4 wallet + x402 payment (Hours 3-4)

1. Fund wallets:
   ```bash
   # Airdrop SOL (run for all 3 wallet addresses from .env)
   solana airdrop 2 <AGENT_ADDRESS> --url devnet
   solana airdrop 2 <HUMAN_ADDRESS> --url devnet
   solana airdrop 2 <SERVER_WALLET_ADDRESS> --url devnet

   # Get devnet USDC for agent:
   # Go to https://faucet.circle.com → USDC → Solana Devnet → paste AGENT_ADDRESS → get 20 USDC
   ```

2. Provision Squads multisig:
   ```bash
   pnpm provision
   # Output: SQUADS_MULTISIG_PDA, SQUADS_VAULT_PDA, SQUADS_SPENDING_LIMIT_PDA
   # Copy these 3 values into .env
   ```

3. Fund the Squads vault with USDC:
   - The vault PDA is printed by `pnpm provision`
   - Send 5 USDC from agent wallet to vault PDA
   - Use: `pnpm tsx scripts/fund-vault.ts` (create this script if needed)

4. Run full demo:
   ```bash
   # Terminal 1: keep server running
   pnpm server

   # Terminal 2:
   pnpm demo
   ```

5. **STOP GATE:** Only proceed to Phase 3 when you see a Solana Explorer URL with a confirmed USDC transfer.

6. Commit: `git add -A && git commit -m "feat: [2.0] Squads v4 agent wallet provisioned + x402 payment confirmed"`

---

### PHASE 3 — Complete e2e + transaction log (Hours 5-6)

The demo agent at `agents/demo.ts` already exists. Verify it:
1. Calls `ping` (free) → succeeds
2. Calls `solana_price` (paid) → x402 fires → USDC transfers → Explorer link logged
3. Calls `account_info` (paid) → same flow
4. Tests spend limit rejection → policy blocks 10 USDC payment

If any test fails, debug and fix before moving to Phase 4.

Verify the SQLite log:
```bash
node -e "import('better-sqlite3').then(({default:DB}) => { const db=new DB('./swigpay.db'); console.log(db.prepare('SELECT * FROM payments').all()); })"
```

Commit: `git add -A && git commit -m "feat: [3.0] Full e2e demo + SQLite payment log working"`

---

### PHASE 4 — Dashboard + README + Demo Video (Hours 7-8)

1. Start the dashboard:
   ```bash
   pnpm dashboard
   # Opens on http://localhost:3000
   ```

2. Verify dashboard shows:
   - Agent card with vault address + daily spend progress
   - Transaction feed with payment history
   - Pending approvals (if any)

3. If dashboard has errors: fix them. The dashboard code is in `apps/dashboard/`.

4. Write `README.md` (use `/demo-prep` workflow for template)

5. Record 3-minute demo video showing:
   - Terminal: `pnpm demo` with Explorer link
   - Browser: Solana Explorer showing USDC transfer confirmed
   - Browser: Dashboard with transaction feed
   - Terminal: spend limit rejection output

6. Final commit:
   ```bash
   git add -A
   git commit -m "feat: [4.0] Dashboard + README + demo ready"
   git push origin main
   ```

---

## Key Technical Notes

### x402 Package Imports (USE THESE EXACTLY)
```typescript
// Server-side
import { createPaymentWrapper, x402ResourceServer } from "@x402/mcp";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";   // NOTE: /exact/server
import { SOLANA_DEVNET_CAIP2, USDC_DEVNET_ADDRESS } from "@x402/svm";

// Client-side
import { createx402MCPClient } from "@x402/mcp";
import { ExactSvmScheme, SOLANA_DEVNET_CAIP2 } from "@x402/svm";  // NOTE: no /exact/server
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";
```

### Squads v4 SDK Imports (USE THESE EXACTLY)
```typescript
import * as multisig from "@sqds/multisig";
import { Permissions, Permission, Period } from "@sqds/multisig";
// multisig.rpc.multisigCreateV2(...)
// multisig.rpc.multisigAddSpendingLimit(...)
// multisig.rpc.spendingLimitUse(...)
// multisig.getMultisigPda({ createKey: createKey.publicKey })
// multisig.getVaultPda({ multisigPda, index: 0 })
// multisig.getSpendingLimitPda({ multisigPda, createKey: limitCreateKey.publicKey })
```

### Squads Spending Limit Amount
```typescript
// multisigAddSpendingLimit: amount is BigInt
const dailyLimitRaw = BigInt(Math.round(dailyLimitUsdc * 1_000_000));

// spendingLimitUse: amount is number
const amountRaw = Math.round(amountUsdc * 1_000_000);
```

### USDC Transfer from Vault (spendingLimitUse)
The spending limit lets the AGENT sign a USDC transfer FROM the vault TO the server wallet.
The agent does NOT need USDC in its own wallet — the vault holds the USDC.
The agent needs SOL for gas fees only.

### If Squads Blocks > 45 Minutes
Switch to fallback: raw keypair with off-chain spend limits.
The spend policy enforcement in `packages/agent-wallet/src/spendPolicy.ts` still works.
Mark clearly in code and README: "Squads integration attempted in squads.ts"
This still fully qualifies for Bounty 1 (x402 works).

---

## START NOW

Run `/start-phase1` in Windsurf, or run `pnpm install` manually.
Report back after each phase gate passes.
