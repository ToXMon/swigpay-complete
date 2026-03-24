#!/usr/bin/env node

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { base58 } from "@scure/base";
import { loadEnv } from "../packages/agent-wallet/src/config.js";
import { USDC_DEVNET_ADDRESS } from "@x402/svm";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function fundVault() {
  const env = loadEnv();
  
  if (!env.AGENT_PRIVATE_KEY_BASE58) {
    throw new Error("AGENT_PRIVATE_KEY_BASE58 not found in .env");
  }
  
  if (!env.SQUADS_VAULT_PDA) {
    throw new Error("SQUADS_VAULT_PDA not found in .env - run pnpm provision first");
  }

  console.log("🏦 Funding Squads Vault with USDC");
  console.log("Agent:", env.AGENT_ADDRESS);
  console.log("Vault:", env.SQUADS_VAULT_PDA);

  // Create agent keypair (not signer)
  const agentKeypair = Keypair.fromSecretKey(base58.decode(env.AGENT_PRIVATE_KEY_BASE58));

  // Get or create agent's USDC token account
  const agentUsdcAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    agentKeypair,
    new PublicKey(USDC_DEVNET_ADDRESS),
    agentKeypair.publicKey
  );

  // Get or create vault's USDC token account
  const vaultPda = new PublicKey(env.SQUADS_VAULT_PDA);
  const vaultUsdcAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    agentKeypair,
    new PublicKey(USDC_DEVNET_ADDRESS),
    vaultPda
  );

  // Check agent's USDC balance
  const agentBalance = await connection.getTokenAccountBalance(agentUsdcAccount.address);
  const balanceUsdc = Number(agentBalance.value.amount) / 1_000_000;
  
  console.log(`Agent USDC balance: ${balanceUsdc} USDC`);

  if (balanceUsdc < 1) {
    throw new Error("Agent wallet needs at least 1 USDC to fund vault. Get USDC from https://faucet.circle.com");
  }

  // Transfer 5 USDC to vault (5,000,000 units due to 6 decimals)
  const transferAmount = 5_000_000; // 5 USDC
  
  const transferTx = await transfer(
    connection,
    agentKeypair,
    agentUsdcAccount.address,
    vaultUsdcAccount.address,
    agentKeypair,
    transferAmount
  );

  console.log("✅ Transfer confirmed!");
  console.log(`TxHash: ${transferTx}`);
  console.log(`🔗 https://explorer.solana.com/tx/${transferTx}?cluster=devnet`);

  // Verify vault balance
  const vaultBalance = await connection.getTokenAccountBalance(vaultUsdcAccount.address);
  const vaultBalanceUsdc = Number(vaultBalance.value.amount) / 1_000_000;
  
  console.log(`Vault USDC balance: ${vaultBalanceUsdc} USDC`);
}

fundVault().catch(console.error);
