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
  console.log(`\n# --- ${name} ---`);
  console.log(`# Public key: ${kp.publicKey.toBase58()}`);
  console.log(`# Airdrop: solana airdrop 2 ${kp.publicKey.toBase58()} --url devnet`);
  return { name, publicKey: kp.publicKey.toBase58(), privateKeyBase58 };
}

const server = generateWallet("Server Wallet (receives x402 payments)");
const agent = generateWallet("Agent Wallet (makes x402 payments via Squads)");
const human = generateWallet("Human Operator Wallet (Squads configAuthority)");

console.log("\n\n# ========================================");
console.log("# Copy these into your .env file:");
console.log("# ========================================\n");
console.log(`SERVER_WALLET_PRIVATE_KEY_BASE58=${server.privateKeyBase58}`);
console.log(`SERVER_WALLET_ADDRESS=${server.publicKey}`);
console.log(`\nAGENT_PRIVATE_KEY_BASE58=${agent.privateKeyBase58}`);
console.log(`AGENT_ADDRESS=${agent.publicKey}`);
console.log(`\nHUMAN_PRIVATE_KEY_BASE58=${human.privateKeyBase58}`);
console.log(`HUMAN_ADDRESS=${human.publicKey}`);

console.log("\n\n# ========================================");
console.log("# Next steps:");
console.log("# ========================================");
console.log(`# 1. Airdrop SOL to all wallets:`);
console.log(`#    solana airdrop 2 ${server.publicKey} --url devnet`);
console.log(`#    solana airdrop 2 ${agent.publicKey} --url devnet`);
console.log(`#    solana airdrop 2 ${human.publicKey} --url devnet`);
console.log(`# 2. Get devnet USDC for AGENT wallet:`);
console.log(`#    https://faucet.circle.com → USDC → Solana Devnet → ${agent.publicKey}`);
console.log(`# 3. Provision Squads wallet: pnpm provision`);
console.log("# ========================================\n");
