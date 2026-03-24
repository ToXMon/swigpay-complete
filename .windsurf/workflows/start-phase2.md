---
description: Phase 2 — Squads v4 wallet provisioning and x402 payment client. Run /start-phase2.
---

# Phase 2: Squads v4 Agent Wallet + x402 Client (Hours 3-4)

Prerequisites: Phase 1 complete, .env filled with wallet keys, SOL airdropped

1. Airdrop SOL to all wallets:
   ```bash
   solana airdrop 2 $(grep AGENT_ADDRESS .env | cut -d= -f2) --url devnet
   solana airdrop 2 $(grep HUMAN_ADDRESS .env | cut -d= -f2) --url devnet
   solana airdrop 2 $(grep SERVER_WALLET_ADDRESS .env | cut -d= -f2) --url devnet
   ```

2. Check balances:
   ```bash
   pnpm fund-check
   ```

3. Get devnet USDC for AGENT wallet:
   - Visit: https://faucet.circle.com
   - Select: USDC → Solana Devnet
   - Paste your AGENT_ADDRESS
   - Get 20 USDC

4. Provision the Squads v4 multisig + spending limit:
   ```bash
   pnpm provision
   ```
   Copy the output SQUADS_* values into .env

5. Send USDC to vault:
   ```bash
   # After getting USDC in AGENT wallet, the provision script shows the vault address
   # The x402 payments will USE the vault, not the agent wallet directly
   # For demo: agent wallet needs USDC for gas + the vault needs USDC for payments
   # Fund both: get 10 USDC to agent wallet via Circle faucet
   # Then transfer 5 USDC to vault: pnpm tsx scripts/fund-vault.ts
   ```

6. Run the demo to verify the full payment flow:
   ```bash
   pnpm demo
   ```
   Expected output:
   - "Squads Vault: <PDA>"
   - "[x402] Payment requested: solana_price"
   - "[x402] ✅ Payment confirmed: <txHash>"
   - "🔗 https://explorer.solana.com/tx/..."

7. Phase 2 COMPLETE when:
   - Squads multisig PDA visible on Solana Explorer
   - USDC transfer confirmed on Solana Explorer devnet
   - Spend limit rejection test passes (demo Test 4)
   - Commit: `git add -A && git commit -m "feat: [2.0] Squads v4 agent wallet + x402 payments working"`
