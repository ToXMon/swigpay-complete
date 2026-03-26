import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import type { Commitment, ConfirmOptions, Connection, PublicKey, Signer } from "@solana/web3.js";
import { PublicKey as SolanaPublicKey } from "@solana/web3.js";
import { USDC_MINT_ADDRESS } from "./config";

const USDC_MINT = new SolanaPublicKey(USDC_MINT_ADDRESS);

export function getUsdcAssociatedTokenAddress(owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    USDC_MINT,
    owner,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

export async function ensureUsdcAssociatedTokenAccount(params: {
  connection: Connection;
  payer: Signer;
  owner: PublicKey;
  commitment?: Commitment;
  confirmOptions?: ConfirmOptions;
}): Promise<PublicKey> {
  try {
    const account = await getOrCreateAssociatedTokenAccount(
      params.connection,
      params.payer,
      USDC_MINT,
      params.owner,
      true,
      params.commitment,
      params.confirmOptions,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return account.address;
  } catch (error) {
    console.error("[spl-token] Failed to ensure USDC associated token account", {
      owner: params.owner.toBase58(),
      error,
    });
    throw error;
  }
}
