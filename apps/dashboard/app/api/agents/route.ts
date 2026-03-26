import { NextResponse } from "next/server";
import "../loadDashboardEnv";
import { EXPLORER_BASE_URL, getPaymentsByAgent, SOLANA_NETWORK } from "@swigpay/agent-wallet";

const SAFE_DEFAULT_CONFIG = {
  agentAddress: "Not configured",
  vaultPda: "—",
  multisigPda: "—",
  spendingLimitPda: "—",
  dailyLimitUsdc: 0,
  perTxLimitUsdc: 0,
  explorerBase: "https://explorer.solana.com",
  network: "devnet",
};

export async function GET(req: Request) {
  try {
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
  } catch (error) {
    console.error("Failed to load agent data:", error);
    return NextResponse.json(
      { error: "Database not available. Run setup scripts first.", config: SAFE_DEFAULT_CONFIG },
      { status: 503 },
    );
  }
}
