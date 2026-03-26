"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PaymentRecord } from "@swigpay/agent-wallet";
import { AgentOverview } from "./components/AgentOverview";
import { MetricCard } from "./components/MetricCard";
import { PendingApprovals } from "./components/PendingApprovals";
import { TransactionFeed } from "./components/TransactionFeed";
import { AgentData, fetchJson, formatUsdc, PaymentsResponse } from "./dashboardData";

export default function Dashboard() {
  const [data, setData] = useState<AgentData | null>(null);
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (showRefreshingState = false) => {
    if (showRefreshingState) {
      setRefreshing(true);
    }

    try {
      const [agentRes, txRes] = await Promise.all([
        fetchJson<AgentData>("/api/agents"),
        fetchJson<PaymentsResponse>("/api/transactions"),
      ]);
      setData(agentRes);
      setAllPayments(txRes.payments);
      setError(null);
    } catch (refreshError) {
      console.error("Failed to refresh dashboard data", refreshError);
      setError("Unable to load dashboard data right now. Please try again shortly.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh(true);
    const timer = setInterval(() => {
      void refresh();
    }, 5000);

    return () => clearInterval(timer);
  }, [refresh]);

  const handleApprove = useCallback(async (id: number, action: "approve" | "reject") => {
    setBusyAction({ id, action });

    try {
      await fetchJson<{ success: boolean }>("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      await refresh();
      setError(null);
    } catch (approvalError) {
      console.error("Failed to update payment approval", approvalError);
      setError("We could not update that approval. Please try again.");
    } finally {
      setBusyAction(null);
    }
  }, [refresh]);

  const pending = useMemo(
    () => allPayments.filter((payment) => payment.status === "pending_approval"),
    [allPayments],
  );
  const spentToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return allPayments
      .filter((payment) => payment.status === "approved" && payment.createdAt?.startsWith(today))
      .reduce((sum, payment) => sum + payment.amountUsdc, 0);
  }, [allPayments]);
  const approvedCount = useMemo(
    () => allPayments.filter((payment) => payment.status === "approved").length,
    [allPayments],
  );
  const totalSpent = useMemo(
    () => allPayments
      .filter((payment) => payment.status === "approved")
      .reduce((sum, payment) => sum + payment.amountUsdc, 0),
    [allPayments],
  );
  const lastPayment = allPayments[0] ?? null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-gray-100">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 px-6 py-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">SwigPay</p>
          <p className="mt-2 text-lg font-semibold text-white">Loading dashboard state...</p>
          <p className="mt-1 text-sm text-gray-400">Connecting to the local transaction log and agent config.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_right,rgba(34,211,238,0.08),transparent_28%),#030712] px-6 py-8 text-gray-100">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Phase 4 dashboard
              </span>
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                {data?.config.network ?? "devnet"}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">SwigPay</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-400">
              Human oversight for OpenClaw agent smart wallets, Squads spending limits, and x402 USDC micropayments on Solana.
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">
              Penn Blockchain Conference Hackathon 2026 · Bounty 1 + Bounty 3
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Live feed</p>
              <p className="mt-1 text-sm text-white">{refreshing ? "Refreshing..." : "Refreshes every 5s"}</p>
            </div>
            <button
              type="button"
              onClick={() => void refresh(true)}
              disabled={refreshing}
              className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh now"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Daily usage"
            value={data ? `${spentToday.toFixed(3)} / ${data.config.dailyLimitUsdc.toFixed(3)} USDC` : "—"}
            caption={data ? `${Math.max(0, data.config.dailyLimitUsdc - spentToday).toFixed(3)} USDC remaining today` : "Waiting for agent config"}
            tone="success"
          />
          <MetricCard
            title="Approved payments"
            value={`${approvedCount}`}
            caption={`${formatUsdc(totalSpent)} settled through x402`}
            tone="info"
          />
          <MetricCard
            title="Pending approvals"
            value={`${pending.length}`}
            caption={pending.length === 0 ? "No human actions needed right now" : "Human review required before settlement"}
            tone="warning"
          />
          <MetricCard
            title="Latest payment"
            value={lastPayment ? formatUsdc(lastPayment.amountUsdc) : "No payments"}
            caption={lastPayment ? lastPayment.tool : "Run pnpm demo to seed the feed"}
          />
        </div>

        {/* Agent Card */}
        {data && <AgentOverview config={data.config} spentToday={spentToday} />}

        {/* Pending Approvals */}
        <PendingApprovals busyAction={busyAction} onAction={handleApprove} payments={pending} />

        {/* Transaction Feed */}
        <TransactionFeed payments={allPayments} />
      </div>
    </div>
  );
}
