import type { PaymentRecord } from "@swigpay/agent-wallet";

export interface AgentData {
  config: {
    agentAddress: string;
    vaultPda: string;
    multisigPda: string;
    dailyLimitUsdc: number;
    perTxLimitUsdc: number;
    explorerBase: string;
    network: string;
  };
  payments: PaymentRecord[];
}

export interface PaymentsResponse {
  payments: PaymentRecord[];
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return response.json() as Promise<T>;
}

export function formatUsdc(value: number) {
  return `${value.toFixed(value >= 1 ? 3 : 6)} USDC`;
}
