import { useState } from "react";
import type { PaymentRecord } from "@swigpay/agent-wallet";
import { ExplorerLink } from "./ExplorerLink";
import { relativeTime } from "../dashboardData";

interface TransactionFeedProps {
  payments: PaymentRecord[];
  index?: number;
}

const BASE_DELAY = 0;
const STAGGER_MS = 80;

type StatusFilter = "all" | "approved" | "pending_approval" | "rejected";

const FILTER_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Pending", value: "pending_approval" },
  { label: "Rejected", value: "rejected" },
];

function shortHash(value: string) {
  return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "—";
}

function statusClasses(status: PaymentRecord["status"]) {
  if (status === "approved") return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "pending_approval") return "border border-amber-500/20 bg-amber-500/10 text-amber-200";
  return "border border-red-500/20 bg-red-500/10 text-red-200";
}

function statusLabel(status: PaymentRecord["status"]) {
  if (status === "pending_approval") return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function fullTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function TransactionFeed({ payments, index = 0 }: TransactionFeedProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const sectionDelay = `${BASE_DELAY + index * STAGGER_MS}ms`;

  const filtered = filter === "all"
    ? payments
    : payments.filter((p) => p.status === filter);

  return (
    <section
      className="rounded-2xl border border-gray-800/80 bg-gray-900/80 p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.24)] animate-fade-in-up"
      style={{ animationDelay: sectionDelay }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Transaction feed</h2>
          <p className="mt-1 text-sm text-gray-400">Recent x402 payment activity recorded in the SwigPay SQLite log.</p>
        </div>
        <span className="shrink-0 rounded-full border border-gray-700 bg-gray-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
          {filtered.length} records
        </span>
      </div>

      {/* Status filter tabs */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {FILTER_TABS.map((tab) => {
          const isActive = filter === tab.value;
          const count = tab.value === "all"
            ? payments.length
            : payments.filter((p) => p.status === tab.value).length;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
                isActive
                  ? "border-cyan-500/30 bg-cyan-500/15 text-cyan-200"
                  : "border-gray-800/60 bg-transparent text-gray-400 hover:border-gray-700 hover:bg-gray-800/40 hover:text-gray-300"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 tabular-nums ${isActive ? "text-cyan-300" : "text-gray-600"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-gray-700 bg-gray-950/70 p-6 text-sm text-gray-400">
          {payments.length === 0
            ? "No transactions recorded yet. Run `pnpm demo` to generate paid tool calls and explorer links."
            : `No ${filter === "all" ? "" : filter.replace("_", " ") + " "}transactions found.`}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-gray-800">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
              <thead className="bg-gray-950/80 text-left text-xs uppercase tracking-[0.2em] text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Tool</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Transaction</th>
                  <th className="px-4 py-3 font-medium">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((payment, i) => (
                  <tr
                    key={payment.id}
                    className={`transition-all duration-200 hover:bg-gray-800/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
                      i % 2 === 0 ? "bg-gray-900/50" : "bg-gray-900/30"
                    }`}
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-1">
                        <p className="font-medium text-white">{payment.tool}</p>
                        <p className="max-w-[300px] truncate font-mono text-xs text-gray-500" title={payment.endpoint}>
                          {payment.endpoint}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top font-medium tabular-nums text-cyan-200">
                      {payment.amountUsdc.toFixed(6)} USDC
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(payment.status)}`}>
                        {statusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top font-mono text-xs text-gray-300">
                      {payment.explorerUrl ? (
                        <ExplorerLink href={payment.explorerUrl} className="font-mono text-xs hover:text-cyan-300 transition-colors">
                          {shortHash(payment.txHash)}
                        </ExplorerLink>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-gray-400" title={fullTimestamp(payment.createdAt)}>
                      {relativeTime(payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
