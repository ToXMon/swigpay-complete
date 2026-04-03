/**
 * SwigPay — Squads v4 Smart Account Provisioning
 * Uses @sqds/multisig v2.1.4
 * Program: SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf (mainnet + devnet)
 */
import "dotenv/config";
import * as multisig from "@sqds/multisig";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { base58 } from "@scure/base";
import type { AgentConfig } from "./types";
import {
  buildExplorerAddressUrl,
  buildExplorerTransactionUrl,
  EXPLORER_BASE_URL,
  SOLANA_NETWORK,
  SOLANA_RPC_URL,
  USDC_DECIMALS,
  USDC_MINT_ADDRESS,
  USDC_RAW_MULTIPLIER,
} from "./config";
import {
  ensureUsdcAssociatedTokenAccount,
  getUsdcAssociatedTokenAddress,
} from "./tokenAccounts";

const RPC_URL = SOLANA_RPC_URL;

export function getConnection(): Connection {
  return new Connection(RPC_URL, "confirmed");
}

export function loadKeypairFromBase58(base58Key: string): Keypair {
  return Keypair.fromSecretKey(base58.decode(base58Key));
}

async function getProgramTreasury(connection: Connection): Promise<PublicKey> {
  const programConfigPda = multisig.getProgramConfigPda({})[0];
  const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(connection, programConfigPda);
  return programConfig.treasury;
}

/**
 * Provision a Squads v4 multisig for an OpenClaw agent.
 *
 * Creates:
 *   1. A 1-of-2 multisig (agent OR human can execute)
 *   2. A USDC spending limit for the agent (daily limit)
 *
 * The vault PDA is where USDC should be deposited.
 * Agent uses spendingLimitUse to transfer USDC from vault.
 */
export async function provisionAgentWallet(params: {
  agentKeypair: Keypair;
  humanKeypair: Keypair;
  dailyLimitUsdc: number;
  agentName: string;
}): Promise<AgentConfig> {
  try {
    const { agentKeypair, humanKeypair, dailyLimitUsdc, agentName } = params;
    const connection = getConnection();
    const configTreasury = await getProgramTreasury(connection);


    const createKey = Keypair.generate();
    const [multisigPda] = multisig.getMultisigPda({ createKey: createKey.publicKey });
    const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });


    const sig = await multisig.rpc.multisigCreateV2({
      connection,
      treasury: configTreasury,
      createKey,
      creator: humanKeypair,
      multisigPda,
      configAuthority: humanKeypair.publicKey,
      threshold: 1,
      members: [
        { key: agentKeypair.publicKey, permissions: multisig.types.Permissions.fromPermissions([multisig.types.Permission.Initiate, multisig.types.Permission.Execute]) },
        { key: humanKeypair.publicKey, permissions: multisig.types.Permissions.all() },
      ],
      timeLock: 0,
      rentCollector: null,
      memo: `SwigPay agent: ${agentName}`,
    });

    await connection.confirmTransaction(sig, "confirmed");

    const limitCreateKey = Keypair.generate();
    const [spendingLimitPda] = multisig.getSpendingLimitPda({
      multisigPda,
      createKey: limitCreateKey.publicKey,
    });
    const dailyLimitRaw = BigInt(Math.round(dailyLimitUsdc * USDC_RAW_MULTIPLIER));

    const limitSig = await multisig.rpc.multisigAddSpendingLimit({
      connection,
      feePayer: humanKeypair,
      multisigPda,
      configAuthority: humanKeypair.publicKey,
      spendingLimit: spendingLimitPda,
      rentPayer: humanKeypair,
      createKey: limitCreateKey.publicKey,
      vaultIndex: 0,
      mint: new PublicKey(USDC_MINT_ADDRESS),
      amount: dailyLimitRaw,
      period: multisig.types.Period.Day,
      members: [agentKeypair.publicKey],
      destinations: [],
      memo: `Spending limit: ${dailyLimitUsdc} USDC/day`,
    });

    await connection.confirmTransaction(limitSig, "confirmed");

    const vaultUsdcAta = await ensureUsdcAssociatedTokenAccount({
      connection,
      payer: humanKeypair,
      owner: vaultPda,
    });

    const config: AgentConfig = {
      name: agentName,
      agentAddress: agentKeypair.publicKey.toBase58(),
      humanAddress: humanKeypair.publicKey.toBase58(),
      multisigPda: multisigPda.toBase58(),
      vaultPda: vaultPda.toBase58(),
      spendingLimitPda: spendingLimitPda.toBase58(),
      dailyLimitUsdc,
      perTxLimitUsdc: dailyLimitUsdc / 10,
      approvalThresholdUsdc: dailyLimitUsdc * 0.5,
      whitelistedEndpoints: [],
      createdAt: new Date().toISOString(),
    };


    return config;
  } catch (error) {
    console.error("[squads] Failed to provision agent wallet", {
      agentName: params.agentName,
      dailyLimitUsdc: params.dailyLimitUsdc,
      agent: params.agentKeypair.publicKey.toBase58(),
      human: params.humanKeypair.publicKey.toBase58(),
      error,
    });
    throw error;
  }
}

// ---- Standalone test: run `pnpm tsx src/squads.ts` ----
if (import.meta.url === `file://${process.argv[1]}`) {
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58;
  const humanKey = process.env.HUMAN_PRIVATE_KEY_BASE58;
  if (!agentKey || !humanKey) {
    console.error("Set AGENT_PRIVATE_KEY_BASE58 and HUMAN_PRIVATE_KEY_BASE58 in .env");
    process.exit(1);
  }
  const agentKeypair = loadKeypairFromBase58(agentKey);
  const humanKeypair = loadKeypairFromBase58(humanKey);
  await provisionAgentWallet({
    agentKeypair,
    humanKeypair,
    dailyLimitUsdc: 1.0,
    agentName: "demo-openclaw-agent",
  });
}
