/**
 * SwigPay — Core Types
 */

export interface AgentConfig {
  name: string;
  agentAddress: string;       // agent's Solana public key
  humanAddress: string;       // human operator's public key
  multisigPda: string;        // Squads v4 multisig PDA
  vaultPda: string;           // Vault PDA (holds USDC)
  spendingLimitPda: string;   // Spending limit PDA
  dailyLimitUsdc: number;     // e.g. 1.0 USDC/day
  perTxLimitUsdc: number;     // e.g. 0.01 USDC/tx (off-chain check)
  approvalThresholdUsdc: number; // above this: require human approval
  whitelistedEndpoints: string[]; // allowed MCP server URLs, [] = any
  createdAt: string;
}

export interface SpendPolicy {
  dailyLimitUsdc: number;
  perTxLimitUsdc: number;
  approvalThresholdUsdc: number;
  whitelistedEndpoints: string[];
}

export type PaymentStatus = "approved" | "pending_approval" | "rejected" | "failed";

export interface PaymentRecord {
  id?: number;
  agentId: string;            // agent address
  tool: string;               // MCP tool name
  endpoint: string;           // MCP server URL
  amountUsdc: number;         // e.g. 0.001
  amountRaw: number;          // native units (amountUsdc * 1e6)
  txHash: string;
  status: PaymentStatus;
  createdAt: string;
  explorerUrl: string;
}

export interface SpendPolicyResult {
  approved: boolean;
  reason?: string;
  requiresHumanApproval?: boolean;
}
