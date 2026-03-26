"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PaymentRecord } from "@swigpay/agent-wallet";
import { AgentOverview } from "./components/AgentOverview";
import { MetricCard } from "./components/MetricCard";
import { PendingApprovals } from "./components/PendingApprovals";
import { TransactionFeed } from "./components/TransactionFeed";
import { AgentData, fetchJson, fetchJsonSafe, formatUsdc, PaymentsResponse } from "./dashboardData";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

const BASE_DELAY = 0;
const STAGGER_MS = 80;

/* ── Shimmer skeleton helper ── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-lg bg-gradient-to-r from-gray-800 via-gray-700/40 to-gray-800 bg-[length:200%_100%] ${className}`}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_right,rgba(34,211,238,0.08),transparent_28%),#030712] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header skeleton */}
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-16 w-36" />
            <Skeleton className="h-16 w-32" />
          </div>
        </div>

        {/* Approvals skeleton */}
        <div className="mb-6 rounded-2xl border border-gray-800/80 bg-gray-900/80 p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="mt-4 h-4 w-96" />
          <Skeleton className="mt-4 h-20 w-full" />
        </div>

        {/* Metric cards skeleton */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-800/80 bg-gray-900/80 p-4"
              style={{ animationDelay: `${BASE_DELAY + i * STAGGER_MS}ms` }}
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-40" />
              <Skeleton className="mt-2 h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Agent skeleton */}
        <div className="mb-6 rounded-2xl border border-gray-800/80 bg-gray-900/80 p-6">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-3 h-4 w-72" />
          <Skeleton className="mt-5 h-16 w-full" />
        </div>

        {/* Transaction feed skeleton */}
        <div className="rounded-2xl border border-gray-800/80 bg-gray-900/80 p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-3 h-4 w-64" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<AgentData | null>(null);
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [busyAction, setBusyAction] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  const refresh = useCallback(async (showRefreshingState = false, retryCount = 0) => {
    if (showRefreshingState) {
      setRefreshing(true);
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 15000);
      });

      const [agentRes, txRes] = await Promise.race([
        Promise.all([
          fetchJson<AgentData>("/api/agents"),
          fetchJson<PaymentsResponse>("/api/transactions"),
        ]),
        timeoutPromise,
      ]) as [AgentData, PaymentsResponse];

      setData(agentRes);
      setAllPayments(txRes.payments);
      setError(null);
    } catch (refreshError) {
      console.error("Failed to refresh dashboard data", refreshError);

      if (retryCount === 0) {
        setRetrying(true);
        setTimeout(() => {
          setRetrying(false);
          void refresh(showRefreshingState, 1);
        }, 2000);
        return;
      }

      if (refreshError instanceof Error && refreshError.message === "Request timeout") {
        setError("Dashboard refresh timed out. Please try again.");
      } else {
        setError("Unable to load dashboard data right now. Please try again shortly.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* Background refresh — silent, never throws into UI */
  const silentRefresh = useCallback(async () => {
    const [agentRes, txRes] = await Promise.all([
      fetchJsonSafe<AgentData>("/api/agents"),
      fetchJsonSafe<PaymentsResponse>("/api/transactions"),
    ]);
    if (agentRes && txRes) {
      setData(agentRes);
      setAllPayments(txRes.payments);
    }
  }, []);

  useEffect(() => {
    void refresh(true);
    const timer = setInterval(() => {
      void silentRefresh();
    }, 10000);
    return () => clearInterval(timer);
  }, [refresh, silentRefresh]);

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
      setError("We could not update that approval. Please try again.");
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
      .reduce((sum, payment) => sum + (typeof payment.amountUsdc === "number" ? payment.amountUsdc : 0), 0);
  }, [allPayments]);
  const approvedCount = useMemo(
    () => allPayments.filter((payment) => payment.status === "approved").length,
    [allPayments],
  );
  const totalSpent = useMemo(
    () => allPayments
      .filter((payment) => payment.status === "approved")
      .reduce((sum, payment) => sum + (typeof payment.amountUsdc === "number" ? payment.amountUsdc : 0), 0),
    [allPayments],
  );
  const lastPayment = allPayments[0] ?? null;

  if (loading) {
    return <LoadingSkeleton />;
  }

  /* ── Section index for stagger calculations ── */
  const approvalsIdx = 0;
  const metricsIdx = 1;
  const agentIdx = 2;
  const feedIdx = 3;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_right,rgba(34,211,238,0.08),transparent_28%),#030712] px-6 py-8 text-gray-100">
      <div className="mx-auto max-w-6xl">
        {/* ── Header ── */}
        <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="animate-fade-in" style={{ animationDelay: `${BASE_DELAY}ms` }}>
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
          <div className="flex flex-wrap items-center gap-3 animate-fade-in" style={{ animationDelay: `${BASE_DELAY + STAGGER_MS}ms` }}>
            <div className="rounded-2xl border border-gray-800/80 bg-gray-900/80 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Live feed</p>
              <p className="mt-1 text-sm text-white">
                {retrying ? "Retrying…" : refreshing ? "Refreshing…" : "Updates every 10s"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh(true)}
              disabled={refreshing || retrying}
              className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing…" : "Refresh now"}
            </button>
          </div>
        </div>

        {/* ── Error banner with dismiss ── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 animate-fade-in">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="flex-1 text-sm text-red-100">{error}</p>
            <button
              type="button"
              onClick={dismissError}
              className="shrink-0 rounded-lg p-1 text-red-300/60 transition hover:bg-red-500/10 hover:text-red-200"
              aria-label="Dismiss error"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Pending Approvals — elevated, before metrics ── */}
        <div className="mb-6">
          <PendingApprovals
            busyAction={busyAction}
            onAction={handleApprove}
            payments={pending}
            index={approvalsIdx}
          />
        </div>

        {/* ── Metric cards ── */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            index={0}
            title="Daily usage"
            value={data ? `${spentToday.toFixed(3)} / ${(data.config.dailyLimitUsdc || 0).toFixed(3)} USDC` : "—"}
            caption={data ? `${Math.max(0, (data.config.dailyLimitUsdc || 0) - spentToday).toFixed(3)} USDC remaining today` : "Waiting for agent config"}
            tone="success"
          />
          <MetricCard
            index={1}
            title="Approved payments"
            value={`${approvedCount}`}
            caption={`${formatUsdc(totalSpent)} settled through x402`}
            tone="info"
          />
          <MetricCard
            index={2}
            title="Pending approvals"
            value={`${pending.length}`}
            caption={pending.length === 0 ? "No human actions needed right now" : "Human review required before settlement"}
            tone="warning"
          />
          <MetricCard
            index={3}
            title="Latest payment"
            value={lastPayment ? formatUsdc(lastPayment.amountUsdc) : "No payments"}
            caption={lastPayment ? lastPayment.tool : "Run pnpm demo to seed the feed"}
          />
        </div>

        {/* ── Agent Overview (null-safe: handles data===null with Setup Required) ── */}
        <div className="mb-6">
          <AgentOverview
            config={data?.config ?? {
              agentAddress: "Not configured",
              vaultPda: "—",
              multisigPda: "—",
              spendingLimitPda: "—",
              dailyLimitUsdc: 0,
              perTxLimitUsdc: 0,
              explorerBase: "https://explorer.solana.com",
              network: "devnet",
            }}
            spentToday={spentToday}
            index={agentIdx}
          />
        </div>

        {/* ── Transaction Feed ── */}
        <TransactionFeed payments={allPayments} index={feedIdx} />
      </div>

      {/* ── Toast Notifications ── */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm transition-all animate-slide-in-right ${
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
