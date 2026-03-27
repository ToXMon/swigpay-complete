/**
 * Agent Zero Wallet Bridge — CLI interface for Agent Zero (Python AI)
 *
 * Usage:
 *   pnpm tsx scripts/agent-zero-bridge.ts provision
 *   pnpm tsx scripts/agent-zero-bridge.ts fund [--amount <usdc>]
 *   pnpm tsx scripts/agent-zero-bridge.ts list-tools
 *   pnpm tsx scripts/agent-zero-bridge.ts call-tool <name> [--args '<json>']
 *   pnpm tsx scripts/agent-zero-bridge.ts retry-approved <payment_id>
 *   pnpm tsx scripts/agent-zero-bridge.ts status
 *
 * All output goes to stdout as JSON; errors go to stderr only.
 */
import "dotenv/config";
import { PublicKey } from "@solana/web3.js";
import { transfer } from "@solana/spl-token";
import {
  buildExplorerTransactionUrl,
  createSwigPayClient,
  DEFAULT_MCP_SERVER_URL,
  enforceSpendPolicy,
  ensureUsdcAssociatedTokenAccount,
  getConnection,
  getUsdcAssociatedTokenAddress,
  getPendingApproval,
  insertPayment,
  loadKeypairFromBase58,
  provisionAgentWallet,
  USDC_RAW_MULTIPLIER,
} from "@swigpay/agent-wallet";
import type { AgentConfig, SpendPolicy } from "@swigpay/agent-wallet";

const SUBCOMMAND = process.argv[2];

// ---- Tool price map ----
const TOOL_PRICES_USDC: Record<string, number> = {
  expensive_tool: 0.50,
  // everything else defaults to MCP_PRICE_PER_CALL_USD from env
};

// ---- Spend policy builder ----
function buildSpendPolicyFromEnv(): SpendPolicy {
  const approvalThreshold = Number(process.env.SQUADS_APPROVAL_THRESHOLD_USDC ?? "0.5");
  const perTxEnv = Number(process.env.SQUADS_PER_TX_LIMIT_USDC ?? "0.01");
  return {
    dailyLimitUsdc: Number(process.env.SQUADS_DAILY_LIMIT_USDC ?? "1.0"),
    // perTxLimit must be >= approvalThreshold so approval gate is the binding constraint
    perTxLimitUsdc: Math.max(perTxEnv, approvalThreshold),
    approvalThresholdUsdc: approvalThreshold,
    whitelistedEndpoints: [],
  };
}

function parseAmountFlag(): number {
  const idx = process.argv.indexOf("--amount");
  if (idx !== -1 && process.argv[idx + 1]) {
    const val = Number(process.argv[idx + 1]);
    if (!Number.isFinite(val) || val <= 0) {
      throw new Error("--amount must be a positive number");
    }
    return val;
  }
  return 5.0;
}

function parseArgsFlag(): Record<string, unknown> {
  const idx = process.argv.indexOf("--args");
  if (idx !== -1 && process.argv[idx + 1]) {
    try {
      const parsed = JSON.parse(process.argv[idx + 1]);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      throw new Error("--args must be a JSON object");
    } catch (err) {
      if (err instanceof Error && err.message.includes("--args must be")) throw err;
      throw new Error(`--args must be valid JSON: ${process.argv[idx + 1]}`);
    }
  }
  return {};
}

function usage(): void {
  process.stderr.write(
    "Usage: pnpm tsx scripts/agent-zero-bridge.ts <subcommand>\n" +
      "\n" +
      "Subcommands:\n" +
      "  provision                        Provision a Squads v4 agent wallet\n" +
      "  fund [--amount N]                Fund vault with USDC (default: 5.0)\n" +
      "  list-tools                      List available MCP tools\n" +
      "  call-tool <name> [--args '<json>']  Call an MCP tool (triggers x402 payment)\n" +
      "  retry-approved <payment_id>       Retry a previously approved payment\n" +
      "  status                          Report current wallet state (no transactions)\n" +
      "\n"
  );
}

async function provision(): Promise<void> {
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58;
  const humanKey = process.env.HUMAN_PRIVATE_KEY_BASE58;

  if (!agentKey || !humanKey) {
    process.stderr.write(
      "Error: AGENT_PRIVATE_KEY_BASE58 and HUMAN_PRIVATE_KEY_BASE58 must be set in .env\n"
    );
    process.exit(1);
  }

  const agentKeypair = loadKeypairFromBase58(agentKey);
  const humanKeypair = loadKeypairFromBase58(humanKey);
  const dailyLimitUsdc = Number(process.env.SQUADS_DAILY_LIMIT_USDC ?? "1.0");

  const config = await provisionAgentWallet({
    agentKeypair,
    humanKeypair,
    dailyLimitUsdc,
    agentName: "openclaw-agent-1",
  });

  const vaultUsdcAta = getUsdcAssociatedTokenAddress(
    new PublicKey(config.vaultPda)
  ).toBase58();

  const result = {
    multisigPda: config.multisigPda,
    vaultPda: config.vaultPda,
    spendingLimitPda: config.spendingLimitPda,
    vaultUsdcAta,
    agentAddress: config.agentAddress,
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

async function fund(): Promise<void> {
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58;
  const vaultPdaStr = process.env.SQUADS_VAULT_PDA;

  if (!agentKey) {
    process.stderr.write("Error: AGENT_PRIVATE_KEY_BASE58 must be set in .env\n");
    process.exit(1);
  }

  if (!vaultPdaStr) {
    process.stderr.write(
      "Error: SQUADS_VAULT_PDA not found in .env — run 'provision' first\n"
    );
    process.exit(1);
  }

  const amountUsdc = parseAmountFlag();
  const agentKeypair = loadKeypairFromBase58(agentKey);
  const vaultPda = new PublicKey(vaultPdaStr);
  const connection = getConnection();

  const agentUsdcAccount = await ensureUsdcAssociatedTokenAccount({
    connection,
    payer: agentKeypair,
    owner: agentKeypair.publicKey,
  });
  const vaultUsdcAccount = await ensureUsdcAssociatedTokenAccount({
    connection,
    payer: agentKeypair,
    owner: vaultPda,
  });

  const agentBalance = await connection.getTokenAccountBalance(agentUsdcAccount);
  const balanceUsdc = Number(agentBalance.value.amount) / USDC_RAW_MULTIPLIER;

  if (balanceUsdc < amountUsdc) {
    process.stderr.write(
      `Error: Agent has ${balanceUsdc} USDC but needs ${amountUsdc} USDC\n`
    );
    process.exit(1);
  }

  const transferAmount = Math.round(amountUsdc * USDC_RAW_MULTIPLIER);
  const txHash = await transfer(
    connection,
    agentKeypair,
    agentUsdcAccount,
    vaultUsdcAccount,
    agentKeypair,
    transferAmount
  );

  const result = {
    vaultUsdcAta: vaultUsdcAccount.toBase58(),
    amountUsdc,
    txHash,
    explorerUrl: buildExplorerTransactionUrl(txHash),
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

function loadAgentConfigFromEnv(): AgentConfig {
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58;
  const agentAddress = process.env.AGENT_ADDRESS;
  const humanAddress = process.env.HUMAN_ADDRESS;
  const multisigPda = process.env.SQUADS_MULTISIG_PDA;
  const vaultPda = process.env.SQUADS_VAULT_PDA;
  const spendingLimitPda = process.env.SQUADS_SPENDING_LIMIT_PDA;

  if (!agentKey || !agentAddress || !humanAddress || !multisigPda || !vaultPda || !spendingLimitPda) {
    throw new Error(
      "Missing required env vars. Required: " +
        "AGENT_PRIVATE_KEY_BASE58, AGENT_ADDRESS, HUMAN_ADDRESS, " +
        "SQUADS_MULTISIG_PDA, SQUADS_VAULT_PDA, SQUADS_SPENDING_LIMIT_PDA"
    );
  }

  return {
    name: "agent-zero-bridge",
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
}

async function listTools(): Promise<void> {
  const agentConfig = loadAgentConfigFromEnv();
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58!;

  const { listTools: listMcpTools, close } = await createSwigPayClient({
    agentConfig,
    agentPrivateKeyBase58: agentKey,
  });

  try {
    const { tools } = await listMcpTools();
    const result = tools.map((t) => ({
      name: t.name,
      description: t.description,
    }));
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } finally {
    await close();
  }
}

async function callTool(): Promise<void> {
  const toolName = process.argv[3];
  if (!toolName) {
    process.stderr.write("Error: call-tool requires a tool name as argument\n");
    process.exit(1);
  }

  const args = parseArgsFlag();
  const agentConfig = loadAgentConfigFromEnv();

  // ---- Pre-flight spend policy check ----
  const toolPriceUsdc = TOOL_PRICES_USDC[toolName] ?? Number(process.env.MCP_PRICE_PER_CALL_USD ?? "0.001");
  const policy = buildSpendPolicyFromEnv();
  const policyResult = enforceSpendPolicy({
    agentId: agentConfig.agentAddress,
    amountUsdc: toolPriceUsdc,
    endpoint: DEFAULT_MCP_SERVER_URL,
    policy,
  });

  if (!policyResult.approved) {
    if (policyResult.requiresHumanApproval) {
      // Insert pending_approval record — NO MCP call
      const amountRaw = Math.round(toolPriceUsdc * USDC_RAW_MULTIPLIER);
      const paymentId = insertPayment({
        agentId: agentConfig.agentAddress,
        tool: toolName,
        endpoint: DEFAULT_MCP_SERVER_URL,
        amountUsdc: toolPriceUsdc,
        amountRaw,
        txHash: "",
        status: "pending_approval",
        createdAt: new Date().toISOString(),
        explorerUrl: "",
        toolArgs: JSON.stringify(args),
      });
      process.stdout.write(JSON.stringify({
        tool: toolName,
        status: "pending_approval",
        paymentId,
        reason: policyResult.reason,
        amountUsdc: toolPriceUsdc,
      }));
      return;
    } else {
      // Hard reject
      process.stdout.write(JSON.stringify({
        tool: toolName,
        status: "rejected",
        reason: policyResult.reason,
        amountUsdc: toolPriceUsdc,
      }));
      return;
    }
  }

  // ---- Policy approved — proceed with normal MCP call ----
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58!;

  const { callTool: callMcpTool, close } = await createSwigPayClient({
    agentConfig,
    agentPrivateKeyBase58: agentKey,
  });

  try {
    const result = await callMcpTool(toolName, args);
    const resultText = (result.content as Array<{ text?: string }>)[0]?.text ?? "";

    if (result.paymentMade && result.paymentResponse) {
      const paymentResponse = result.paymentResponse as {
        transaction?: string;
        amount?: number;
        extensions?: { amountRaw?: number };
      };
      const txHash = paymentResponse.transaction ?? "";
      const amountRaw = Number(paymentResponse.extensions?.amountRaw ?? paymentResponse.amount ?? 0);
      const amountUsdc = amountRaw / USDC_RAW_MULTIPLIER;

      const output = {
        tool: toolName,
        result: resultText,
        paymentMade: true,
        txHash,
        amountUsdc,
        explorerUrl: buildExplorerTransactionUrl(txHash),
      };
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
    } else {
      const output = {
        tool: toolName,
        result: resultText,
        paymentMade: false,
        txHash: null,
        amountUsdc: null,
        explorerUrl: null,
      };
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
    }
  } finally {
    await close();
  }
}

async function retryApproved(): Promise<void> {
  const paymentId = Number(process.argv[3]);
  if (!paymentId || isNaN(paymentId)) {
    process.stderr.write("Usage: agent-zero-bridge.ts retry-approved <payment_id>\n");
    process.exit(1);
  }

  const record = getPendingApproval(paymentId);
  if (!record) {
    process.stderr.write(`No approved payment found with id ${paymentId}\n`);
    process.exit(1);
  }

  // Parse stored tool args
  const retryArgs: Record<string, unknown> = record.toolArgs ? JSON.parse(record.toolArgs) : {};

  // Build config with BYPASSED threshold so x402client doesn't re-check
  const agentConfig = loadAgentConfigFromEnv();
  agentConfig.approvalThresholdUsdc = 9999;

  const { callTool: callMcpTool, close } = await createSwigPayClient({
    agentConfig,
    agentPrivateKeyBase58: process.env.AGENT_PRIVATE_KEY_BASE58!,
  });

  try {
    const result = await callMcpTool(record.tool, retryArgs);
    const output: Record<string, unknown> = {
      tool: record.tool,
      status: "approved",
      result: result.content?.[0]?.text ?? "",
      paymentMade: result.paymentMade ?? false,
      txHash: null,
      amountUsdc: null,
      explorerUrl: null,
    };
    if (result.paymentMade && result.paymentResponse) {
      const pr = result.paymentResponse as {
        transaction?: string;
        amount?: number;
        extensions?: { amountRaw?: number };
      };
      output.txHash = pr.transaction ?? null;
      output.amountUsdc = Number(pr.extensions?.amountRaw ?? 0) / USDC_RAW_MULTIPLIER;
      output.explorerUrl = output.txHash ? buildExplorerTransactionUrl(output.txHash as string) : null;
    }
    process.stdout.write(JSON.stringify(output));
  } finally {
    await close();
  }
}

async function status(): Promise<void> {
  const agentAddress = process.env.AGENT_ADDRESS ?? null;
  const humanAddress = process.env.HUMAN_ADDRESS ?? null;
  const multisigPda = process.env.SQUADS_MULTISIG_PDA ?? null;
  const vaultPda = process.env.SQUADS_VAULT_PDA ?? null;
  const spendingLimitPda = process.env.SQUADS_SPENDING_LIMIT_PDA ?? null;

  const keysSet = !!(agentAddress && humanAddress);
  const squadsProvisioned = !!multisigPda;

  let vaultUsdcAta: string | null = null;
  let vaultUsdcBalance = 0;
  let vaultFunded = false;

  if (vaultPda) {
    try {
      const connection = getConnection();
      vaultUsdcAta = getUsdcAssociatedTokenAddress(
        new PublicKey(vaultPda)
      ).toBase58();
      const balance = await connection.getTokenAccountBalance(
        new PublicKey(vaultUsdcAta)
      );
      vaultUsdcBalance = Number(balance.value.amount) / USDC_RAW_MULTIPLIER;
      vaultFunded = vaultUsdcBalance > 0;
    } catch {
      // Vault ATA may not exist yet — that's fine
      vaultUsdcBalance = 0;
      vaultFunded = false;
    }
  }

  const result = {
    agentAddress,
    humanAddress,
    multisigPda,
    vaultPda,
    spendingLimitPda,
    vaultUsdcAta,
    vaultUsdcBalance,
    stepsComplete: {
      keysSet,
      squadsProvisioned,
      vaultFunded,
    },
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

async function main(): Promise<void> {
  try {
    switch (SUBCOMMAND) {
      case "provision":
        await provision();
        break;
      case "fund":
        await fund();
        break;
      case "list-tools":
        await listTools();
        break;
      case "call-tool":
        await callTool();
        break;
      case "retry-approved":
        await retryApproved();
        break;
      case "status":
        await status();
        break;
      default:
        usage();
        process.exit(1);
    }
  } catch (err) {
    process.stderr.write(
      `Error: ${err instanceof Error ? err.message : String(err)}\n`
    );
    process.exit(1);
  }
}

main();
