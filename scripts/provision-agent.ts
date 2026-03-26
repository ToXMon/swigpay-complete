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

console.log("🏦 Provisioning SwigPay agent wallet...\n");

const config = await provisionAgentWallet({
  agentKeypair,
  humanKeypair,
  dailyLimitUsdc,
  agentName: "openclaw-agent-1",
});
const vaultUsdcAta = getUsdcAssociatedTokenAddress(new PublicKey(config.vaultPda)).toBase58();

console.log("\n✅ Done! Add these to your .env:\n");
console.log(`SQUADS_MULTISIG_PDA=${config.multisigPda}`);
console.log(`SQUADS_VAULT_PDA=${config.vaultPda}`);
console.log(`SQUADS_SPENDING_LIMIT_PDA=${config.spendingLimitPda}`);
console.log(`\n💰 Fund the agent vault with USDC on devnet:`);
console.log(`   ${buildExplorerAddressUrl(config.vaultPda)}`);
console.log(`   Vault PDA: ${config.vaultPda}`);
console.log(`   Vault USDC ATA: ${vaultUsdcAta}`);
console.log("   Or run: pnpm tsx scripts/fund-vault.ts");
