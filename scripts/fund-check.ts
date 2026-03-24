/**
 * Check SOL + USDC balances for all wallets
 * Run: pnpm fund-check
 */
import "dotenv/config";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { SOLANA_RPC_URL, USDC_MINT_ADDRESS } from "@swigpay/agent-wallet";

const RPC = SOLANA_RPC_URL;
const USDC = USDC_MINT_ADDRESS;
const connection = new Connection(RPC, "confirmed");

async function checkWallet(name: string, address: string | undefined) {
  if (!address) { console.log(`${name}: not set`); return; }
  const pubkey = new PublicKey(address);
  const sol = await connection.getBalance(pubkey) / LAMPORTS_PER_SOL;
  let usdc = 0;
  try {
    const ata = await getAssociatedTokenAddress(new PublicKey(USDC), pubkey);
    const acc = await getAccount(connection, ata);
    usdc = Number(acc.amount) / 1_000_000;
  } catch {}
  const status = sol < 0.1 ? "⚠️ LOW SOL" : usdc < 0.1 ? "⚠️ LOW USDC" : "✅";
  console.log(`${status} ${name}:`);
  console.log(`   Address: ${address}`);
  console.log(`   SOL: ${sol.toFixed(4)}`);
  console.log(`   USDC: ${usdc.toFixed(6)}`);
}

console.log(`\n💰 Wallet Balances (${RPC})\n${"─".repeat(50)}`);
await checkWallet("Server Wallet", process.env.SERVER_WALLET_ADDRESS);
console.log();
await checkWallet("Agent Wallet", process.env.AGENT_ADDRESS);
console.log();
await checkWallet("Squads Vault", process.env.SQUADS_VAULT_PDA);
console.log();
await checkWallet("Human Wallet", process.env.HUMAN_ADDRESS);
console.log("\nGet devnet USDC: https://faucet.circle.com → USDC → Solana Devnet");
console.log("Get devnet SOL:  solana airdrop 2 <ADDRESS> --url devnet\n");
