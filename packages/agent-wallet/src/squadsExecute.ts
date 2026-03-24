import * as multisig from "@sqds/multisig";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  buildExplorerTransactionUrl,
  USDC_DECIMALS,
  USDC_MINT_ADDRESS,
  USDC_RAW_MULTIPLIER,
} from "./config.js";
import { getConnection } from "./squads.js";

export async function executeSpendingLimitPayment(params: {
  agentKeypair: Keypair;
  multisigPda: string;
  spendingLimitPda: string;
  destinationAddress: string;
  amountUsdc: number;
}): Promise<{ txHash: string; explorerUrl: string }> {
  const { agentKeypair, multisigPda, spendingLimitPda, destinationAddress, amountUsdc } = params;
  const connection = getConnection();
  const amountRaw = Math.round(amountUsdc * USDC_RAW_MULTIPLIER);
  const { TOKEN_PROGRAM_ID } = await import("@solana/spl-token");

  console.log("[squads] Executing spending limit payment:");
  console.log(`[squads]   To: ${destinationAddress}`);
  console.log(`[squads]   Amount: ${amountUsdc} USDC (${amountRaw} raw)`);

  const txHash = await multisig.rpc.spendingLimitUse({
    connection,
    feePayer: agentKeypair,
    member: agentKeypair,
    multisigPda: new PublicKey(multisigPda),
    spendingLimit: new PublicKey(spendingLimitPda),
    mint: new PublicKey(USDC_MINT_ADDRESS),
    vaultIndex: 0,
    amount: amountRaw,
    decimals: USDC_DECIMALS,
    destination: new PublicKey(destinationAddress),
    tokenProgram: TOKEN_PROGRAM_ID,
    memo: `SwigPay x402 payment: ${amountUsdc} USDC`,
  });

  await connection.confirmTransaction(txHash, "confirmed");
  const explorerUrl = buildExplorerTransactionUrl(txHash);
  console.log(`[squads] Payment confirmed ✅ ${explorerUrl}`);

  return { txHash, explorerUrl };
}
