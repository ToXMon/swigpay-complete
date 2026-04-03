#!/usr/bin/env node

import "dotenv/config";
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { base58 } from "@scure/base";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function transferSol() {
  // Read private keys from .env
  const serverKey = process.env.SERVER_WALLET_PRIVATE_KEY_BASE58;
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58;
  const humanAddress = process.env.HUMAN_ADDRESS;

  if (!serverKey || !agentKey || !humanAddress) {
    throw new Error("Missing required env vars: SERVER_WALLET_PRIVATE_KEY_BASE58, AGENT_PRIVATE_KEY_BASE58, HUMAN_ADDRESS");
  }


  const serverKeypair = Keypair.fromSecretKey(base58.decode(serverKey));
  const agentKeypair = Keypair.fromSecretKey(base58.decode(agentKey));
  const humanPubkey = new PublicKey(humanAddress);

  // Transfer 0.5 SOL from server wallet
  const serverTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: serverKeypair.publicKey,
      toPubkey: humanPubkey,
      lamports: 0.5 * 1_000_000_000, // 0.5 SOL in lamports
    })
  );

  const serverSignature = await sendAndConfirmTransaction(connection, serverTx, [serverKeypair]);

  // Transfer 0.5 SOL from agent wallet
  const agentTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: agentKeypair.publicKey,
      toPubkey: humanPubkey,
      lamports: 0.5 * 1_000_000_000, // 0.5 SOL in lamports
    })
  );

  const agentSignature = await sendAndConfirmTransaction(connection, agentTx, [agentKeypair]);

}

transferSol().catch(console.error);
