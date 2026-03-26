/**
 * Agent Zero Wallet Bridge — CLI interface for Agent Zero (Python AI)
 *
 * Usage:
 *   pnpm tsx scripts/agent-zero-bridge.ts provision
 *   pnpm tsx scripts/agent-zero-bridge.ts fund [--amount <usdc>]
 *
 * All output goes to stdout as JSON; errors go to stderr only.
 */
import "dotenv/config";
import { PublicKey } from "@solana/web3.js";
import { transfer } from "@solana/spl-token";
import {
  buildExplorerTransactionUrl,
  ensureUsdcAssociatedTokenAccount,
  getConnection,
  getUsdcAssociatedTokenAddress,
  loadKeypairFromBase58,
  provisionAgentWallet,
  USDC_RAW_MULTIPLIER,
} from "@swigpay/agent-wallet";

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

async function main(): Promise<void> {
  try {
    switch (SUBCOMMAND) {
      case "provision":
        await provision();
        break;
      case "fund":
        await fund();
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
