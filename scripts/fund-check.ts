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
    const pubkey = new PublicKey(address);
    const sol = await connection.getBalance(pubkey) / LAMPORTS_PER_SOL;
    const ata = getUsdcAssociatedTokenAddress(pubkey);
    let usdc = 0;
    try {
      const acc = await getAccount(connection, ata);
      usdc = Number(acc.amount) / 1_000_000;
    } catch {}
    const status = sol < 0.1 ? "⚠️ LOW SOL" : usdc < 0.1 ? "⚠️ LOW USDC" : "✅";
  } catch (error) {
    console.error("[fund-check] Failed to check wallet", { name, address, error });
  }
}

await checkWallet("Server Wallet", process.env.SERVER_WALLET_ADDRESS);
await checkWallet("Agent Wallet", process.env.AGENT_ADDRESS);
await checkWallet("Squads Vault", process.env.SQUADS_VAULT_PDA);
await checkWallet("Human Wallet", process.env.HUMAN_ADDRESS);
