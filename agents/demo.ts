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
  if (multisigPda) {
  } else {
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


  // ---- Connect to MCP server ----
  const { callTool, listTools, close } = await createSwigPayClient({
    agentConfig,
    agentPrivateKeyBase58: agentKey,
  });

  // ---- List available tools ----
  const { tools } = await listTools();
  for (const tool of tools) {
  }

  // ---- Test 1: Free tool (no payment) ----
  const pingResult = await callTool("ping", {});

  // ---- Test 2: Paid tool — SOL price ----
  try {
    const priceResult = await callTool("solana_price", {});
  } catch (err) {
    console.error("❌ Payment failed:", err);
  }

  // ---- Test 3: Paid tool — Account info ----
  try {
    const accountResult = await callTool("account_info", { address: agentConfig.vaultPda });
  } catch (err) {
    console.error("❌ Payment failed:", err);
  }

  // ---- Test 4: Spend limit rejection ----
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
  if (!rejectResult.approved) {
  }

  await close();
}

main().catch((err) => {
  console.error("❌ Demo failed:", err);
  process.exit(1);
});
