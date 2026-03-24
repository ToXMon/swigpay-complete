/**
 * SwigPay — OpenClaw-Compatible Demo Agent
 * Phase 3: Full end-to-end demo
 *
 * Run: pnpm demo
 * (Requires MCP server running on :4022 and .env filled in)
 */
import "dotenv/config";
import { createSwigPayClient, DEFAULT_MCP_SERVER_URL } from "@swigpay/agent-wallet";
import type { AgentConfig } from "@swigpay/agent-wallet";

async function main() {
  console.log("🦞 SwigPay Demo Agent — OpenClaw Compatible");
  console.log("=".repeat(50));

  // ---- Load config from env ----
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58;
  const agentAddress = process.env.AGENT_ADDRESS;
  const humanAddress = process.env.HUMAN_ADDRESS;
  const multisigPda = process.env.SQUADS_MULTISIG_PDA;
  const vaultPda = process.env.SQUADS_VAULT_PDA;
  const spendingLimitPda = process.env.SQUADS_SPENDING_LIMIT_PDA;

  if (!agentKey || !agentAddress || !humanAddress || !multisigPda || !vaultPda || !spendingLimitPda) {
    console.error("❌ Missing required env vars. Run: pnpm provision first.");
    console.error("   Required: AGENT_PRIVATE_KEY_BASE58, AGENT_ADDRESS, HUMAN_ADDRESS,");
    console.error("             SQUADS_MULTISIG_PDA, SQUADS_VAULT_PDA, SQUADS_SPENDING_LIMIT_PDA");
    process.exit(1);
  }

  // Build agent config from env
  const agentConfig: AgentConfig = {
    name: "demo-openclaw-agent",
    agentAddress,
    humanAddress,
    multisigPda,
    vaultPda,
    spendingLimitPda,
    dailyLimitUsdc: Number(process.env.SQUADS_DAILY_LIMIT_USDC ?? "1.0"),
    perTxLimitUsdc: Number(process.env.SQUADS_PER_TX_LIMIT_USDC ?? "0.01"),
    approvalThresholdUsdc: 0.5,
    whitelistedEndpoints: [],
    createdAt: new Date().toISOString(),
  };

  console.log(`\n📋 Agent: ${agentConfig.agentAddress}`);
  console.log(`   Squads Vault: ${agentConfig.vaultPda}`);
  console.log(`   Daily limit: ${agentConfig.dailyLimitUsdc} USDC`);
  console.log(`   Per-tx limit: ${agentConfig.perTxLimitUsdc} USDC\n`);

  // ---- Connect to MCP server ----
  const { callTool, listTools, close } = await createSwigPayClient({
    agentConfig,
    agentPrivateKeyBase58: agentKey,
  });

  // ---- List available tools ----
  const { tools } = await listTools();
  console.log(`\n📋 Available MCP tools (${tools.length}):`);
  for (const tool of tools) {
    console.log(`   - ${tool.name}: ${tool.description}`);
  }

  // ---- Test 1: Free tool (no payment) ----
  console.log("\n--- Test 1: Free tool (ping) ---");
  const pingResult = await callTool("ping", {});
  console.log("Result:", JSON.stringify(pingResult.content?.[0], null, 2));

  // ---- Test 2: Paid tool — SOL price ----
  console.log("\n--- Test 2: Paid tool (solana_price) ---");
  console.log("This will trigger an x402 payment from the agent's Squads vault...");
  try {
    const priceResult = await callTool("solana_price", {});
    console.log("✅ Payment succeeded!");
    console.log("SOL price data:", priceResult.content?.[0]?.text);
  } catch (err) {
    console.error("❌ Payment failed:", err);
    console.log("💡 Ensure the vault PDA has USDC: send USDC to", agentConfig.vaultPda);
  }

  // ---- Test 3: Paid tool — Account info ----
  console.log("\n--- Test 3: Paid tool (account_info for vault) ---");
  try {
    const accountResult = await callTool("account_info", { address: agentConfig.vaultPda });
    console.log("✅ Payment succeeded!");
    console.log("Vault account info:", accountResult.content?.[0]?.text);
  } catch (err) {
    console.error("❌ Payment failed:", err);
  }

  // ---- Test 4: Spend limit rejection ----
  console.log("\n--- Test 4: Spend limit rejection (simulated over-threshold) ---");
  console.log("Attempting a payment over per-tx limit...");
  // We test this by temporarily checking with a high amount in the policy
  // In production, this would be a real payment attempt that gets rejected
  const { enforceSpendPolicy } = await import("@swigpay/agent-wallet");
  const rejectResult = enforceSpendPolicy({
    agentId: agentConfig.agentAddress,
    amountUsdc: 10.0,  // Way over the 0.01 USDC per-tx limit
    endpoint: DEFAULT_MCP_SERVER_URL,
    policy: {
      dailyLimitUsdc: agentConfig.dailyLimitUsdc,
      perTxLimitUsdc: agentConfig.perTxLimitUsdc,
      approvalThresholdUsdc: agentConfig.approvalThresholdUsdc,
      whitelistedEndpoints: agentConfig.whitelistedEndpoints,
    },
  });
  console.log(`Policy result for 10.0 USDC: approved=${rejectResult.approved}`);
  console.log(`Reason: ${rejectResult.reason}`);
  if (!rejectResult.approved) {
    console.log("✅ Spend limit correctly blocked the payment!");
  }

  await close();
  console.log("\n✅ Demo complete! Check Solana Explorer for payment transactions.");
}

main().catch((err) => {
  console.error("❌ Demo failed:", err);
  process.exit(1);
});
