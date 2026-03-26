import * as multisig from "@sqds/multisig";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  buildExplorerTransactionUrl,
  USDC_DECIMALS,
  USDC_MINT_ADDRESS,
  USDC_RAW_MULTIPLIER,
} from "./config";
import { getConnection } from "./squads";
import {
  ensureUsdcAssociatedTokenAccount,
  getUsdcAssociatedTokenAddress,
} from "./tokenAccounts";

export async function executeSpendingLimitPayment(params: {
  agentKeypair: Keypair;
  multisigPda: string;
  spendingLimitPda: string;
  destinationAddress: string;
  amountUsdc: number;
}): Promise<{ txHash: string; explorerUrl: string }> {
  try {
    const { agentKeypair, multisigPda, spendingLimitPda, destinationAddress, amountUsdc } = params;
    const connection = getConnection();
    const amountRaw = Math.round(amountUsdc * USDC_RAW_MULTIPLIER);
    const { TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
    const multisigPublicKey = new PublicKey(multisigPda);
    const destinationPublicKey = new PublicKey(destinationAddress);
    const [vaultPda] = multisig.getVaultPda({ multisigPda: multisigPublicKey, index: 0 });
    const vaultTokenAccount = await ensureUsdcAssociatedTokenAccount({
      connection,
      payer: agentKeypair,
      owner: vaultPda,
    });
    const destinationTokenAccount = await ensureUsdcAssociatedTokenAccount({
      connection,
      payer: agentKeypair,
      owner: destinationPublicKey,
    });

    console.log("[squads] Executing spending limit payment:");
    console.log(`[squads]   To: ${destinationAddress}`);
    console.log(`[squads]   Amount: ${amountUsdc} USDC (${amountRaw} raw)`);
    console.log(`[squads]   Vault: ${vaultPda.toBase58()}`);
    console.log(`[squads]   Vault USDC ATA: ${vaultTokenAccount.toBase58()}`);
    console.log(`[squads]   Destination USDC ATA: ${destinationTokenAccount.toBase58()}`);

    const txHash = await multisig.rpc.spendingLimitUse({
      connection,
      feePayer: agentKeypair,
      member: agentKeypair,
      multisigPda: multisigPublicKey,
      spendingLimit: new PublicKey(spendingLimitPda),
      mint: new PublicKey(USDC_MINT_ADDRESS),
      vaultIndex: 0,
      amount: amountRaw,
      decimals: USDC_DECIMALS,
      destination: destinationPublicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      memo: `SwigPay x402 payment: ${amountUsdc} USDC`,
    });

    await connection.confirmTransaction(txHash, "confirmed");
    const explorerUrl = buildExplorerTransactionUrl(txHash);
    console.log(`[squads] Payment confirmed ✅ ${explorerUrl}`);

    return { txHash, explorerUrl };
  } catch (error) {
    console.error("[squads] Failed to execute spending limit payment", {
      destinationAddress: params.destinationAddress,
      amountUsdc: params.amountUsdc,
      multisigPda: params.multisigPda,
      spendingLimitPda: params.spendingLimitPda,
      expectedVaultUsdcAta: getUsdcAssociatedTokenAddress(
        multisig.getVaultPda({ multisigPda: new PublicKey(params.multisigPda), index: 0 })[0]
      ).toBase58(),
      error,
    });
    throw error;
  }
}
