/**
 * SwigPay — Wallet Setup Script
 * Generates 3 keypairs and prints env var values
 * Run: pnpm tsx scripts/setup-wallets.ts
 */
import { Keypair } from "@solana/web3.js";
import { base58 } from "@scure/base";

function generateWallet(name: string) {
  const kp = Keypair.generate();
  const privateKeyBase58 = base58.encode(kp.secretKey);
  return { name, publicKey: kp.publicKey.toBase58(), privateKeyBase58 };
}

const server = generateWallet("Server Wallet (receives x402 payments)");
const agent = generateWallet("Agent Wallet (makes x402 payments via Squads)");
const human = generateWallet("Human Operator Wallet (Squads configAuthority)");


