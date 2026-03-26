/**
 * Agent Zero Wallet Bridge — CLI interface for Agent Zero (Python AI)
 *
 * Usage:
 *   pnpm tsx scripts/agent-zero-bridge.ts provision
 *
 * All output goes to stdout as JSON; errors go to stderr only.
 */
import "dotenv/config";
import { PublicKey } from "@solana/web3.js";
import {
  getUsdcAssociatedTokenAddress,
  loadKeypairFromBase58,
  provisionAgentWallet,
} from "@swigpay/agent-wallet";

const SUBCOMMAND = process.argv[2];

function usage(): void {
  process.stderr.write(
    "Usage: pnpm tsx scripts/agent-zero-bridge.ts <subcommand>\n" +
      "\n" +
      "Subcommands:\n" +
      "  provision   Provision a Squads v4 agent wallet\n" +
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

async function main(): Promise<void> {
  try {
    switch (SUBCOMMAND) {
      case "provision":
        await provision();
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
