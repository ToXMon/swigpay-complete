/**
 * Agent Zero Wallet Bridge — CLI interface for Agent Zero (Python AI)
 *
 * Usage:
 *   pnpm tsx scripts/agent-zero-bridge.ts provision
 *   pnpm tsx scripts/agent-zero-bridge.ts fund [--amount <usdc>]
 *   pnpm tsx scripts/agent-zero-bridge.ts list-tools
 *
 * All output goes to stdout as JSON; errors go to stderr only.
 */
import "dotenv/config";
import { PublicKey } from "@solana/web3.js";
import { transfer } from "@solana/spl-token";
import {
  buildExplorerTransactionUrl,
  createSwigPayClient,
  ensureUsdcAssociatedTokenAccount,
  getConnection,
  getUsdcAssociatedTokenAddress,
  loadKeypairFromBase58,
  provisionAgentWallet,
  USDC_RAW_MULTIPLIER,
} from "@swigpay/agent-wallet";
import type { AgentConfig } from "@swigpay/agent-wallet";

const SUBCOMMAND = process.argv[2];

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

function usage(): void {
  process.stderr.write(
    "Usage: pnpm tsx scripts/agent-zero-bridge.ts <subcommand>\n" +
      "\n" +
      "Subcommands:\n" +
      "  provision          Provision a Squads v4 agent wallet\n" +
      "  fund [--amount N]  Fund vault with USDC (default: 5.0)\n" +
      "  list-tools        List available MCP tools\n" +
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
      "Missing required env vars for list-tools. Required: " +
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
