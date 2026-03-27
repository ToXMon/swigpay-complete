"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PaymentRecord } from "@swigpay/agent-wallet";
import { AgentOverview } from "./components/AgentOverview";
import { MetricCard } from "./components/MetricCard";
import { PendingApprovals } from "./components/PendingApprovals";
import { TransactionFeed } from "./components/TransactionFeed";
import { AgentData, fetchJson, formatUsdc, PaymentsResponse } from "./dashboardData";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function Dashboard() {
  const [data, setData] = useState<AgentData | null>(null);
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

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
      setError("Unable to load dashboard data. Retrying...");
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
      addToast(`Payment ${action}d successfully`, "success");
    } catch (approvalError) {
      console.error("Failed to update payment approval", approvalError);
      addToast("Failed to update approval", "error");
    } finally {
      setBusyAction(null);
    }
  }, [refresh, addToast]);

  const pending = useMemo(
    () => allPayments.filter((payment) => payment.status === "pending_approval"),
    [allPayments],
  );
  const spentToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return allPayments
      .filter((payment) => payment.status === "approved" && payment.createdAt?.startsWith(today))
      .reduce((sum, payment) => sum + (typeof payment.amountUsdc === 'number' ? payment.amountUsdc : 0), 0);
  }, [allPayments]);
  const approvedCount = useMemo(
    () => allPayments.filter((payment) => payment.status === "approved").length,
    [allPayments],
  );
  const totalSpent = useMemo(
    () => allPayments
      .filter((payment) => payment.status === "approved")
      .reduce((sum, payment) => sum + (typeof payment.amountUsdc === 'number' ? payment.amountUsdc : 0), 0),
    [allPayments],
  );
  const lastPayment = allPayments[0] ?? null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">SwigPay</p>
          </div>
          <p className="text-lg font-semibold text-white">Connecting to agent wallet...</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
            <div className="h-full w-3/4 animate-pulse rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Live
              </span>
              <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-300">
                {data?.config.network ?? "devnet"}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">SwigPay</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300">
              Human oversight for OpenClaw agent smart wallets. Squads v4 spending limits. x402 USDC micropayments on Solana.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/80 px-4 py-3">
              <div className={`h-2 w-2 rounded-full ${refreshing ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`} />
              <p className="text-sm text-gray-300">{refreshing ? "Syncing..." : "Live"}</p>
            </div>
            <button
              type="button"
              onClick={() => void refresh(true)}
              disabled={refreshing}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            index={0}
            title="Daily usage"
            value={data ? `${spentToday.toFixed(3)} / ${(data.config.dailyLimitUsdc || 0).toFixed(3)} USDC` : "—"}
            caption={data ? `${Math.max(0, (data.config.dailyLimitUsdc || 0) - spentToday).toFixed(3)} USDC remaining` : "Waiting for config"}
            tone="success"
          />
          <MetricCard
            index={1}
            title="Confirmed payments"
            value={`${approvedCount}`}
            caption={`${formatUsdc(totalSpent)} settled via x402`}
            tone="info"
          />
          <MetricCard
            index={2}
            title="Pending approvals"
            value={`${pending.length}`}
            caption={pending.length === 0 ? "All clear — no actions needed" : "Requires human review"}
            tone="warning"
          />
          <MetricCard
            index={3}
            title="Latest payment"
            value={lastPayment ? formatUsdc(lastPayment.amountUsdc) : "—"}
            caption={lastPayment ? lastPayment.tool : "No payments yet"}
            tone="default"
          />
        </div>

        {data && (
          <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <AgentOverview config={data.config} spentToday={spentToday} />
          </div>
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <PendingApprovals busyAction={busyAction} onAction={handleApprove} payments={pending} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
          <TransactionFeed payments={allPayments} />
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur transition-all animate-fade-in-up ${
              toast.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/20 bg-red-500/10 text-red-200"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
