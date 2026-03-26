import type { PaymentRecord } from "@swigpay/agent-wallet";

export interface AgentData {
  config: {
    agentAddress: string;
    vaultPda: string;
    multisigPda: string;
    spendingLimitPda: string;
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
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but got ${contentType} (status ${response.status})`);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchJsonSafe<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    return await fetchJson<T>(url, init);
  } catch {
    return null;
  }
}

export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return dateStr;
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return dateStr;
}

export function formatUsdc(value: number | undefined | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "— USDC";
  }
  return `${value.toFixed(value >= 1 ? 3 : 6)} USDC`;
}
