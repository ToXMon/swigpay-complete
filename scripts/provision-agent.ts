/**
 * SwigPay — Provision Squads v4 Agent Wallet
 * Run AFTER setup-wallets.ts and funding with SOL + USDC
 * Run: pnpm provision
 */
import "dotenv/config";
import { PublicKey } from "@solana/web3.js";
import {
  buildExplorerAddressUrl,
  getUsdcAssociatedTokenAddress,
  loadKeypairFromBase58,
  provisionAgentWallet,
} from "@swigpay/agent-wallet";

const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58;
const humanKey = process.env.HUMAN_PRIVATE_KEY_BASE58;

if (!agentKey || !humanKey) {
  console.error("❌ Set AGENT_PRIVATE_KEY_BASE58 and HUMAN_PRIVATE_KEY_BASE58 in .env");
  process.exit(1);
}

const agentKeypair = loadKeypairFromBase58(agentKey);
const humanKeypair = loadKeypairFromBase58(humanKey);
const dailyLimitUsdc = Number(process.env.SQUADS_DAILY_LIMIT_USDC ?? "1.0");


const config = await provisionAgentWallet({
  agentKeypair,
  humanKeypair,
  dailyLimitUsdc,
  agentName: "openclaw-agent-1",
});
const vaultUsdcAta = getUsdcAssociatedTokenAddress(new PublicKey(config.vaultPda)).toBase58();

