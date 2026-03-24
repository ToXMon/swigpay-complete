# agent-wallet module context
# Auto-loaded by Windsurf when editing files in packages/agent-wallet/

## Purpose
Core wallet logic: Squads v4 provisioning, x402 payment client, spend policy, SQLite log.

## Key Rules
- squads.ts: Use `multisigCreateV2` NOT deprecated `multisigCreate`
- squads.ts: `multisigAddSpendingLimit` amount param is `BigInt` (e.g. `BigInt(1_000_000)`)
- squads.ts: `spendingLimitUse` amount param is `number` (e.g. `1000`) — different from above
- x402client.ts: Import `ExactSvmScheme` from `"@x402/svm"` (NOT `"@x402/svm/exact/server"`)
- x402client.ts: Import `createKeyPairSignerFromBytes` from `"@solana/kit"`
- x402client.ts: Decode base58 key with `base58.decode()` from `"@scure/base"`
- db.ts: All amounts stored as BOTH `amountUsdc` (float) and `amountRaw` (integer * 1e6)
- spendPolicy.ts: Called BEFORE any x402 payment — never skip this check
- USDC has 6 decimals: 1 USDC = 1_000_000 raw units — never confuse

## File Size Limits
- Max 200 lines per file — split if larger
- If squads.ts grows: split into squads-create.ts, squads-limits.ts, squads-execute.ts
