# SwigPay — Root Agent Context
# ⚡ Auto-loaded by Windsurf Cascade on EVERY session

---

## HACKATHON MISSION
**Deadline: March 27, 2026 · 6:00 PM ET**
**Bounty 1** (x402 Agentic Payments, $1,000) + **Bounty 3** (OpenClaw Smart Accounts, $1,000) = **$2,000**

---

## What SwigPay Does

SwigPay provisions OpenClaw AI agents with **Squads v4 multisig smart accounts** on Solana
that enforce human-defined spend limits per member. The agent autonomously pays for MCP tool
calls via the **x402 protocol** (HTTP 402 + USDC on Solana devnet). A Next.js dashboard lets
the human operator provision agents, view all transactions, and approve over-threshold payments.

**This is novel:** Nobody has shipped OpenClaw + Squads v4 smart accounts + x402 in one project.
MCPay (closest competitor) runs on Base with no smart account guardrails.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  HUMAN DASHBOARD  (Next.js :3000)                        │
│  → provision agents, set spend limits, view txns, approve│
└────────────────────────┬─────────────────────────────────┘
                         │ REST
┌────────────────────────▼─────────────────────────────────┐
│  SWIGPAY BACKEND  (Express API in dashboard Next.js)      │
│  → agent registry (SQLite), spend policy enforcement      │
└────────────┬──────────────────────────┬───────────────────┘
             │                          │
┌────────────▼──────┐     ┌─────────────▼──────────┐
│ OPENCLAW AGENT    │     │ MCP SERVER  (:4022)     │
│ agents/demo.ts    │────►│ apps/mcp-server         │
│ MCP client        │◄────│ @x402/mcp + @x402/svm  │
│ Squads v4 wallet  │     │ Paid tools: $0.001 USDC │
│ auto-pays via x402│     │ Free tools: ping        │
└────────────┬──────┘     └────────────────────────┘
             │
┌────────────▼──────────────────────────────────────┐
│  SOLANA DEVNET                                     │
│  Squads v4 Program: SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf
│  USDC Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
│  x402 Facilitator: https://x402.org/facilitator   │
└───────────────────────────────────────────────────┘
```

---

## Tech Stack — EXACT PACKAGES

```
@modelcontextprotocol/sdk  ^1.27.1   MCP server + client (StreamableHTTP)
@x402/mcp                  ^2.5.0    x402 MCP payment wrapper (createPaymentWrapper, createx402MCPClient)
@x402/core                 ^2.5.0    Protocol primitives, HTTPFacilitatorClient
@x402/svm                  ^2.5.0    ExactSvmScheme, SOLANA_DEVNET_CAIP2, USDC_DEVNET_ADDRESS
@sqds/multisig             ^2.1.4    Squads v4 SDK — multisig creation, spending limits
@solana/web3.js            ^1.98.4   Connection, Keypair, PublicKey, Transaction
@solana/spl-token          ^0.3.6    getOrCreateAssociatedTokenAccount, transfer
@solana/kit                ^6.1.0    createKeyPairSignerFromBytes (for x402 signer)
@scure/base                ^2.0.0    base58 decode for private key loading
better-sqlite3             ^11.0.0   SQLite transaction log
express                    ^5.2.1    HTTP server
zod                        ^4.3.6    Runtime validation
dotenv                     latest    Env loading
next                       ^15.0.0   Dashboard frontend
react / react-dom          ^18.3.0   Dashboard UI
tailwindcss                ^3.4.0    Styling
```

---

## Directory Map

```
swigpay/
├── AGENTS.md                          ← THIS FILE (always-on)
├── .windsurfrules                     ← Cascade rules
├── .mcp.json                          ← mcp.solana.com for Cascade
├── .env.example                       ← Required env vars
├── pnpm-workspace.yaml
├── package.json                       ← Root workspace
├── tsconfig.base.json
│
├── apps/
│   ├── mcp-server/                    ← PHASE 1: Paid MCP server
│   │   └── src/
│   │       ├── server.ts              ← Main: x402 + MCP (port 4022)
│   │       └── tools/
│   │           ├── solanaPrice.ts     ← Paid: fetch SOL price
│   │           └── accountInfo.ts     ← Paid: fetch account info
│   └── dashboard/                     ← PHASE 4: Next.js UI
│       └── app/
│           ├── page.tsx               ← Agent list + controls
│           ├── layout.tsx
│           ├── api/agents/route.ts    ← GET/POST agents
│           ├── api/transactions/route.ts ← GET payment history
│           ├── api/approve/route.ts   ← POST approve payment
│           └── components/
│               ├── AgentCard.tsx
│               ├── SpendControls.tsx
│               └── TransactionFeed.tsx
│
├── packages/
│   └── agent-wallet/                  ← PHASE 2: Core wallet logic
│       └── src/
│           ├── index.ts               ← Public exports
│           ├── squads.ts              ← Squads v4 multisig creation + spend limits
│           ├── x402client.ts          ← x402 MCP client with Squads signer
│           ├── spendPolicy.ts         ← Off-chain spend guard + event emitter
│           ├── db.ts                  ← SQLite payment log
│           └── types.ts               ← AgentConfig, SpendPolicy, PaymentRecord
│
├── agents/
│   └── demo.ts                        ← PHASE 3: Full e2e demo (OpenClaw compatible)
│
└── scripts/
    ├── setup-wallets.ts               ← Generate 3 keypairs, print addresses
    └── fund-check.ts                  ← Check SOL + USDC balances
```

---

## Solana Constants (NEVER change during hackathon)

```typescript
// From @x402/svm — import these, don't hardcode
import { SOLANA_DEVNET_CAIP2, USDC_DEVNET_ADDRESS } from "@x402/svm";
// SOLANA_DEVNET_CAIP2 = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"
// USDC_DEVNET_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"

export const SQUADS_PROGRAM_ID = "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf";
export const FACILITATOR_URL = "https://x402.org/facilitator";
export const USDC_DECIMALS = 6;
export const LAMPORTS_PER_USDC = 1_000_000; // 1 USDC = 1,000,000 units
```

---

## Squads v4 Pattern for Agent Wallet

```typescript
import * as multisig from "@sqds/multisig";
import { Permissions, Permission, Period } from "@sqds/multisig";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

// 1. Derive PDAs
const createKey = Keypair.generate();
const [multisigPda] = multisig.getMultisigPda({ createKey: createKey.publicKey });
const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });

// 2. Create 1-of-2 multisig
// agentKeypair = Proposer + Execute (autonomous below spending limit)
// humanKeypair = full Permissions.all() (override authority)
const sig = await multisig.rpc.multisigCreateV2({
  connection,
  createKey,
  creator: humanKeypair,       // pays rent, gets configAuthority
  multisigPda,
  configAuthority: humanKeypair.publicKey,
  threshold: 1,                 // 1-of-2: agent OR human can execute
  members: [
    { key: agentKeypair.publicKey, permissions: Permissions.fromPermissions([Permission.Initiate, Permission.Execute]) },
    { key: humanKeypair.publicKey, permissions: Permissions.all() },
  ],
  timeLock: 0,
});

// 3. Add spending limit for agent (USDC only, per-day)
const [spendingLimitPda] = multisig.getSpendingLimitPda({
  multisigPda, createKey: limitCreateKey.publicKey
});
await multisig.rpc.multisigAddSpendingLimit({
  connection,
  feePayer: humanKeypair,
  multisigPda,
  configAuthority: humanKeypair.publicKey,
  spendingLimit: spendingLimitPda,
  rentPayer: humanKeypair,
  createKey: limitCreateKey.publicKey,
  vaultIndex: 0,
  mint: new PublicKey(USDC_DEVNET_ADDRESS),
  amount: BigInt(1_000_000),    // 1 USDC per day
  period: Period.Day,
  members: [agentKeypair.publicKey],  // only agent uses this limit
  destinations: [],             // [] = any destination allowed
});

// 4. Agent uses spending limit to pay (via spendingLimitUse)
await multisig.rpc.spendingLimitUse({
  connection,
  feePayer: agentKeypair,
  member: agentKeypair,
  multisigPda,
  spendingLimit: spendingLimitPda,
  mint: new PublicKey(USDC_DEVNET_ADDRESS),
  vaultIndex: 0,
  amount: 1000,                 // 0.001 USDC (in units, not dollars)
  decimals: 6,
  destination: serverWallet,
  tokenProgram: TOKEN_PROGRAM_ID,
});
```

---

## x402 + MCP Pattern (from hanzochang/x402-solana-mcp-sample)

```typescript
// SERVER: @x402/mcp createPaymentWrapper
import { createPaymentWrapper, x402ResourceServer } from "@x402/mcp";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactSvmScheme, SOLANA_DEVNET_CAIP2 } from "@x402/svm/exact/server";
const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitatorClient);
resourceServer.register(SOLANA_DEVNET_CAIP2, new ExactSvmScheme());
await resourceServer.initialize();
const accepts = await resourceServer.buildPaymentRequirements({
  scheme: "exact", network: SOLANA_DEVNET_CAIP2,
  payTo: SERVER_WALLET_ADDRESS, price: "$0.001",
});
const wrapWithPayment = createPaymentWrapper(resourceServer, { accepts });
// Wrap any tool handler: server.tool("name", "desc", schema, wrapWithPayment(handler))

// CLIENT: @x402/mcp createx402MCPClient
import { createx402MCPClient } from "@x402/mcp";
import { ExactSvmScheme, SOLANA_DEVNET_CAIP2 } from "@x402/svm";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";
const signer = await createKeyPairSignerFromBytes(base58.decode(AGENT_PRIVATE_KEY));
const client = createx402MCPClient({
  name: "swigpay-agent", version: "1.0.0",
  schemes: [{ network: SOLANA_DEVNET_CAIP2, client: new ExactSvmScheme(signer) }],
  autoPayment: true,
});
```

---

## Build Phases & Time Budget

| Phase | Hours | Goal | Pass Gate |
|-------|-------|------|-----------|
| **1** | 1–2 | MCP server returns HTTP 402 | `pnpm server` → `curl :4022/mcp` shows x402 error on paid tool |
| **2** | 3–4 | Agent pays via x402, Squads wallet provisioned | USDC tx visible on Solana Explorer |
| **3** | 5–6 | Full demo agent e2e + transaction log | `pnpm demo` logs Explorer link |
| **4** | 7–8 | Dashboard UI + README + demo video | Dashboard shows payment feed |

**STOP RULE:** If Phase 1 not done by hour 2, skip MCP transport, use plain HTTP x402 instead.
**STOP RULE:** If Squads creation blocked >45 min, use a raw keypair + off-chain spend policy. Document in README.
**STOP RULE:** Dashboard is OPTIONAL if phases 1-3 deliver a working payment demo.

---

## Quick Demo (3 minutes)

```
Terminal 1:  pnpm server          # MCP server on :4022
Terminal 2:  pnpm dashboard       # Next.js on :3000
Terminal 3:  pnpm demo-flow       # Full automated demo
```

`pnpm demo-flow` runs all 7 steps automatically:
1. Wallet status (reads Squads PDA + vault USDC balance)
2. List MCP tools (4 tools: 1 free, 2 cheap, 1 expensive)
3. Call `ping` — free, no payment
4. Call `solana_price` — $0.001 USDC paid via Squads spendingLimitUse
5. Call `expensive_tool` — $0.50 blocked by spend policy → `pending_approval`
6. Polls DB every 2s waiting for human to Approve in dashboard
7. Auto-retries payment with bypassed limits → $0.50 USDC on-chain tx

**During step 6:** Open http://localhost:3000, click Approve on the yellow card.
The script auto-detects the approval and retries — no manual commands needed.

Legacy manual flow: `scripts/agent-zero-bridge.ts` supports `status`, `list-tools`,
`call-tool <name>`, `retry-approved <id>` subcommands.

---

## Codebase Patterns

- All workspace packages use `import "dotenv/config"` at top for env loading
- Dashboard API routes import `../loadDashboardEnv` side-effect to set DB_PATH
- MCP server uses `StreamableHTTPServerTransport` with session management
- x402 payments go through `SquadsExactScheme` → `spendingLimitUse` (not raw keypair signing)
- Spend policy enforced at TWO levels: bridge script (pre-flight) + x402client (onPaymentRequested)
- Retry-after-approval must bypass ALL limits (threshold + perTx + daily) by setting to 9999

## Known Gotchas

- `spendingLimitUse` amount param is `number`, but `multisigAddSpendingLimit` amount is `BigInt`
- `getPendingApproval` in db.ts filters for `status = 'approved'` (use `getPaymentById` for any status)
- MCP SDK transport path: `StreamableHTTPClientTransport` re-exported from `mcpTransport.ts`
- Vault USDC ATA must exist before funding — `ensureUsdcAssociatedTokenAccount` handles this
- x402 facilitator can be slow (5-10s) — payments may take time to settle
