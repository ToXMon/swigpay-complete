# SwigPay Live Demo Narration Script

> Run this alongside `pnpm demo-flow`. Each section maps to a step.
> Highlighted lines = what you say out loud. Parenthetical notes = what's happening on screen.

---

## SETUP (before starting demo-flow)

**[Show the GitHub repo in browser]**

"So this is SwigPay. It's on main branch. Everything you're about to see is open source and real — real USDC on Solana devnet, real Squads v4 multisig transactions, real x402 protocol payments."

**[In opencode, type: run the full SwigPay demo with pnpm demo-flow]**

"All I need is one command. The script starts the MCP server, the dashboard, and runs the entire demo flow automatically."

---

## STEP 0: Auto-Start (~0-20s)

**[demo-flow starts MCP server + dashboard]**

"The script automatically starts the MCP server on port 4022 and the dashboard on port 3000. It waits for both to be ready before proceeding. No manual terminal setup needed."

---

## STEP 1: Wallet Status (~20-25s)

**[demo-flow prints agent address, vault PDA, balances]**

"The first thing the agent does is check its wallet state. It has a Squads v4 multisig provisioned — this is a 1-of-2 multisig between the AI agent and me, the human operator. The vault holds about 4.5 USDC. That's real USDC sitting in a Squads vault PDA on Solana devnet."

---

## STEP 2: List MCP Tools (~5-10s)

**[demo-flow prints 4 tools]**

"The agent connects to the MCP server and discovers four tools. One is free — a health check. Two cost a fraction of a cent each. And one costs fifty cents and requires human approval. The key insight: the agent doesn't know prices ahead of time. It discovers them through the MCP protocol and the x402 payment requirements that come back with a 402 response."

---

## STEP 3: Call ping (~10-15s)

**[demo-flow calls ping, returns "pong"]**

"First, a free tool. The agent calls ping. No payment, no blockchain transaction. It's just a health check. Watch what happens on the next one."

---

## STEP 4: Call solana_price (~15-30s)

**[demo-flow calls solana_price, x402 payment logs appear, tx confirmed]**

"Now the agent calls solana_price. This costs one-tenth of a cent. What you're seeing in the logs is the x402 payment flow. The MCP server returned a 402 Payment Required. The agent's Squads scheme intercepted it, routed the payment through spendingLimitUse — that's a Squads v4 instruction that transfers USDC from the multisig vault to the server wallet. No raw keypair signing. The agent never touches the vault keys directly."

**[Point at the Explorer link in the output]**

"This is a real Solana transaction. You can open it in Explorer right now — it's on devnet, it's confirmed. One-tenth of a cent of USDC just moved from the agent's Squads vault to the server. That's a micropayment that would be impossible with traditional payment rails."

---

## STEP 5: expensive_tool triggers approval (~30-40s)

**[demo-flow prints pending_approval and instructions]**

"Now the agent tries to call the expensive tool — fifty cents. But our spend policy blocks it. The policy is enforced off-chain before any blockchain transaction is submitted. The payment is marked pending_approval and the agent pauses."

---

## STEP 6: Polling for approval (~40s - whenever you approve)

**[demo-flow shows animated dots polling]**

"While we wait, let me show you the dashboard."

**[Switch to browser at localhost:3000]**

"This is the human oversight dashboard. You can see the payment feed — the solana_price payment is confirmed. And here at the top, there's a yellow card: the expensive_tool payment is waiting for approval. Fifty cents. I, the human operator, get to decide whether this goes through."

**[Click Approve]**

"I'm clicking Approve. The dashboard updates immediately — the pending card disappears."

---

## STEP 7: Auto-retry (~whenever approved + 15-20s)

**[demo-flow detects approval, retries, tx confirmed]**

"Back in the terminal — the agent was polling the database every two seconds. It detected the approval automatically. No manual command needed. It retried the payment with all limits bypassed — because the human already approved it. And there it is — fifty cents USDC just moved from the Squads vault through spendingLimitUse."

**[Point at Explorer link]**

"Another real transaction on Solana Explorer."

---

## CLOSE (~after step 7)

**[Switch to dashboard to show final state]**

"The dashboard now shows the full payment history. Two confirmed transactions — one autonomous, one human-approved. The daily spend tracker shows how much of the budget has been used."

**[Summary]**

"So that's SwigPay in a nutshell. Three things that are novel here:

One — this is the first implementation of the x402 payment protocol on Solana. HTTP 402 plus USDC micropayments through the Squads v4 spending limit. Nobody has shipped this before.

Two — the agent pays for MCP tool calls autonomously, but within programmable guardrails. Per-transaction limits, daily caps, and a human approval threshold. The agent can spend freely below the threshold, but anything above it requires a human click. This is the governance layer that AI agents need when they have wallets.

Three — the whole thing is composable. The MCP server, the Squads wallet, the spend policy, the dashboard — they're all independent pieces. You could swap the dashboard for a Slack bot, or add more tools to the server, or plug in a different agent framework. The x402 protocol handles the payment negotiation generically."

---

## TOUGH QUESTIONS TO PREP FOR

**"Why not just use a regular wallet?"**
A regular wallet gives the agent unlimited spending power. One bug and it drains the wallet. Squads v4 multisig with spending limits means the agent can only spend up to the configured amount per day, per transaction. And the human operator can override anything.

**"Why Solana specifically?"**
Sub-cent finality in under a second. USDC is a first-class token. The x402 protocol was designed for Ethereum but the payment scheme is chain-agnostic — we just implemented the Solana SVM scheme. Micropayments at $0.001 make sense when gas is basically free.

**"What about the MCP transport — why not just use regular HTTP?"**
MCP is the standard protocol for AI agent tool calling. It's what Claude, GPT, and OpenClaw all use. By wrapping MCP tools with x402, we get payments for free — the agent doesn't need to know anything about blockchain, it just calls tools and the payment layer handles the rest.

**"How is this different from MCPay?"**
MCPay runs on Base with no smart account guardrails. SwigPay adds Squads v4 multisig enforcement — per-tx limits, daily caps, human approval thresholds. The agent literally cannot overspend. And we're on Solana, where finality is sub-second and USDC is native.
