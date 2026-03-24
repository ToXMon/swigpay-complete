# mcp-server module context
# Auto-loaded by Windsurf when editing files in apps/mcp-server/

## Purpose
Paid MCP tool server. Wraps tools with @x402/mcp payment gates on Solana devnet.

## Key Rules
- server.ts: Import `ExactSvmScheme` from `"@x402/svm/exact/server"` (server-side import path)
- server.ts: Import `SOLANA_DEVNET_CAIP2`, `USDC_DEVNET_ADDRESS` from `"@x402/svm"` — never hardcode
- server.ts: Facilitator initialized with `HTTPFacilitatorClient` from `"@x402/core/server"`
- server.ts: Port 4022 (from MCP_SERVER_PORT env var)
- Free tools: no wrapper — `server.tool("ping", ..., handler)`
- Paid tools: `server.tool("name", ..., wrapWithPayment(handler))`
- tools/: One file per tool, max 100 lines each

## Verified Working Pattern
Based on: https://github.com/hanzochang/x402-solana-mcp-sample
- `createPaymentWrapper` + `x402ResourceServer` from `@x402/mcp`
- `resourceServer.register(SOLANA_DEVNET_CAIP2, new ExactSvmScheme())` before initialize()
- `buildPaymentRequirements({ scheme: "exact", network: SOLANA_DEVNET_CAIP2, payTo, price: "$0.001" })`
