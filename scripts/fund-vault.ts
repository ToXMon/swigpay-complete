#!/usr/bin/env node

import "dotenv/config";
import { Keypair, PublicKey } from "@solana/web3.js";
import { transfer } from "@solana/spl-token";
import { base58 } from "@scure/base";
import {
  ensureUsdcAssociatedTokenAccount,
  getConnection,
  loadEnv,
} from "@swigpay/agent-wallet";

const connection = getConnection();

async function fundVault() {
  try {
    const env = loadEnv();

    if (!env.AGENT_PRIVATE_KEY_BASE58) {
      throw new Error("AGENT_PRIVATE_KEY_BASE58 not found in .env");
    }

    if (!env.SQUADS_VAULT_PDA) {
      throw new Error("SQUADS_VAULT_PDA not found in .env - run pnpm provision first");
    }

    const agentKeypair = Keypair.fromSecretKey(base58.decode(env.AGENT_PRIVATE_KEY_BASE58));
    const vaultPda = new PublicKey(env.SQUADS_VAULT_PDA);
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
    const balanceUsdc = Number(agentBalance.value.amount) / 1_000_000;


    if (balanceUsdc < 1) {
      throw new Error("Agent wallet needs at least 1 USDC to fund vault. Get USDC from https://faucet.circle.com");
    }

    const transferAmount = 5_000_000;
    const transferTx = await transfer(
      connection,
      agentKeypair,
      agentUsdcAccount,
      vaultUsdcAccount,
      agentKeypair,
      transferAmount
    );


    const vaultBalance = await connection.getTokenAccountBalance(vaultUsdcAccount);
    const vaultBalanceUsdc = Number(vaultBalance.value.amount) / 1_000_000;

  } catch (error) {
    console.error("[fund-vault] Failed to fund Squads vault", { error });
    throw error;
  }
}

fundVault().catch(console.error);
