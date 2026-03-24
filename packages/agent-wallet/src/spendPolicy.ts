/**
 * SwigPay — Off-Chain Spend Policy Guard
 * Enforces per-tx limits and endpoint whitelists BEFORE submitting to Squads
 */
import type { SpendPolicy, SpendPolicyResult } from "./types.js";
import { db, getSpentToday, insertPayment } from "./db.js";

/**
 * Check if a proposed payment is within policy.
 * Call this BEFORE executing any x402 payment.
 */
export function enforceSpendPolicy(params: {
  agentId: string;
  amountUsdc: number;
  endpoint: string;
  policy: SpendPolicy;
}): SpendPolicyResult {
  const { agentId, amountUsdc, endpoint, policy } = params;

  // 1. Per-transaction limit
  if (amountUsdc > policy.perTxLimitUsdc) {
    return {
      approved: false,
      reason: `Per-tx limit exceeded: ${amountUsdc} USDC > ${policy.perTxLimitUsdc} USDC max`,
    };
  }

  // 2. Endpoint whitelist (if set)
  if (policy.whitelistedEndpoints.length > 0) {
    const allowed = policy.whitelistedEndpoints.some((e) => endpoint.startsWith(e));
    if (!allowed) {
      return {
        approved: false,
        reason: `Endpoint not whitelisted: ${endpoint}`,
      };
    }
  }

  // 3. Daily limit check from SQLite
  const spentToday = getSpentToday(agentId);
  if (spentToday + amountUsdc > policy.dailyLimitUsdc) {
    return {
      approved: false,
      reason: `Daily limit exceeded: ${spentToday + amountUsdc} USDC would exceed ${policy.dailyLimitUsdc} USDC/day`,
    };
  }

  // 4. Approval threshold (human must approve above this)
  if (amountUsdc >= policy.approvalThresholdUsdc) {
    return {
      approved: false,
      requiresHumanApproval: true,
      reason: `Amount ${amountUsdc} USDC >= approval threshold ${policy.approvalThresholdUsdc} USDC — requires human approval`,
    };
  }

  return { approved: true };
}
