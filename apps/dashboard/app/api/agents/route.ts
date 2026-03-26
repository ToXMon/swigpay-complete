import { NextResponse } from "next/server";
import "../loadDashboardEnv";
import { EXPLORER_BASE_URL, getPaymentsByAgent, SOLANA_NETWORK } from "@swigpay/agent-wallet";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId") ?? process.env.AGENT_ADDRESS ?? "";
  const payments = getPaymentsByAgent(agentId);
  const config = {
    agentAddress: process.env.AGENT_ADDRESS ?? "",
    vaultPda: process.env.SQUADS_VAULT_PDA ?? "",
    multisigPda: process.env.SQUADS_MULTISIG_PDA ?? "",
    spendingLimitPda: process.env.SQUADS_SPENDING_LIMIT_PDA ?? "",
    dailyLimitUsdc: Number(process.env.SQUADS_DAILY_LIMIT_USDC ?? "1.0"),
    perTxLimitUsdc: Number(process.env.SQUADS_PER_TX_LIMIT_USDC ?? "0.01"),
    explorerBase: EXPLORER_BASE_URL,
    network: SOLANA_NETWORK,
  };
  return NextResponse.json({ config, payments });
}
