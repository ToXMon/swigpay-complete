/**
 * SwigPay — OpenClaw-Compatible Demo Agent
 * Phase 3: Full end-to-end demo
 *
 * Run: pnpm demo
 * (Requires MCP server running on :4022 and .env filled in)
 */
import "dotenv/config";
import { PublicKey } from "@solana/web3.js";
import {
  createSwigPayClient,
  DEFAULT_MCP_SERVER_URL,
  getUsdcAssociatedTokenAddress,
  loadKeypairFromBase58,
  provisionAgentWallet,
} from "@swigpay/agent-wallet";
import type { AgentConfig } from "@swigpay/agent-wallet";

async function main() {
  console.log("🦞 SwigPay Demo Agent — OpenClaw Compatible");
  console.log("=".repeat(50));

  // ---- Load config from env ----
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58;
  const humanKey = process.env.HUMAN_PRIVATE_KEY_BASE58;
  let agentAddress = process.env.AGENT_ADDRESS;
  let humanAddress = process.env.HUMAN_ADDRESS;
  let multisigPda = process.env.SQUADS_MULTISIG_PDA;
  let vaultPda = process.env.SQUADS_VAULT_PDA;
  let spendingLimitPda = process.env.SQUADS_SPENDING_LIMIT_PDA;

  if (!agentKey || !humanKey) {
    console.error("❌ Missing AGENT_PRIVATE_KEY_BASE58 and HUMAN_PRIVATE_KEY_BASE58 in .env");
    process.exit(1);
  }

  // ---- Test 0: Agent Wallet Provisioning ----
  // Fallback demo flow — shows full agent creation lifecycle
  console.log("\n--- Test 0: Agent Wallet Provisioning ---");
  if (multisigPda) {
    console.log("Already provisioned — skipping");
  } else {
    console.log("SQUADS_MULTISIG_PDA not set — provisioning agent wallet...");
    const agentKeypair = loadKeypairFromBase58(agentKey);
    const humanKeypair = loadKeypairFromBase58(humanKey);
    const dailyLimitUsdc = Number(process.env.SQUADS_DAILY_LIMIT_USDC ?? "1.0");

    const config = await provisionAgentWallet({
      agentKeypair,
      humanKeypair,
      dailyLimitUsdc,
      agentName: "demo-openclaw-agent",
    });

    agentAddress = config.agentAddress;
    humanAddress = config.humanAddress;
    multisigPda = config.multisigPda;
    vaultPda = config.vaultPda;
    spendingLimitPda = config.spendingLimitPda;

    const provisionedVaultUsdcAta = getUsdcAssociatedTokenAddress(
      new PublicKey(config.vaultPda)
    ).toBase58();

    console.log("✅ Agent wallet provisioned!");
    console.log(`   Multisig PDA: ${config.multisigPda}`);
    console.log(`   Vault PDA: ${config.vaultPda}`);
    console.log(`   Spending Limit PDA: ${config.spendingLimitPda}`);
    console.log(`   Vault USDC ATA: ${provisionedVaultUsdcAta}`);
    console.log("   Add these to your .env for future runs.\n");
  }

  // Build agent config from env (or freshly provisioned values)
  const agentConfig: AgentConfig = {
    name: "demo-openclaw-agent",
    agentAddress: agentAddress!,
    humanAddress: humanAddress!,
    multisigPda: multisigPda!,
    vaultPda: vaultPda!,
    spendingLimitPda: spendingLimitPda!,
    dailyLimitUsdc: Number(process.env.SQUADS_DAILY_LIMIT_USDC ?? "1.0"),
    perTxLimitUsdc: Number(process.env.SQUADS_PER_TX_LIMIT_USDC ?? "0.01"),
    approvalThresholdUsdc: 0.5,
    whitelistedEndpoints: [],
    createdAt: new Date().toISOString(),
  };
  const vaultUsdcAta = getUsdcAssociatedTokenAddress(new PublicKey(agentConfig.vaultPda)).toBase58();

  console.log(`\n📋 Agent: ${agentConfig.agentAddress}`);
  console.log(`   Squads Vault: ${agentConfig.vaultPda}`);
  console.log(`   Vault USDC ATA: ${vaultUsdcAta}`);
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
    console.log("💡 Ensure the vault USDC ATA is funded or run: pnpm tsx scripts/fund-vault.ts");
    console.log("   Vault USDC ATA:", vaultUsdcAta);
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
