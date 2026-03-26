/**
 * Check SOL + USDC balances for all wallets
 * Run: pnpm fund-check
 */
import "dotenv/config";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";
import {
  getUsdcAssociatedTokenAddress,
  SOLANA_RPC_URL,
} from "@swigpay/agent-wallet";

const RPC = SOLANA_RPC_URL;
const connection = new Connection(RPC, "confirmed");

async function checkWallet(name: string, address: string | undefined) {
  try {
    if (!address) { console.log(`${name}: not set`); return; }
    const pubkey = new PublicKey(address);
    const sol = await connection.getBalance(pubkey) / LAMPORTS_PER_SOL;
    const ata = getUsdcAssociatedTokenAddress(pubkey);
    let usdc = 0;
    try {
      const acc = await getAccount(connection, ata);
      usdc = Number(acc.amount) / 1_000_000;
    } catch {}
    const status = sol < 0.1 ? "⚠️ LOW SOL" : usdc < 0.1 ? "⚠️ LOW USDC" : "✅";
    console.log(`${status} ${name}:`);
    console.log(`   Address: ${address}`);
    console.log(`   USDC ATA: ${ata.toBase58()}`);
    console.log(`   SOL: ${sol.toFixed(4)}`);
    console.log(`   USDC: ${usdc.toFixed(6)}`);
  } catch (error) {
    console.error("[fund-check] Failed to check wallet", { name, address, error });
  }
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
