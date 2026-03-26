import { useMemo, useState } from "react";
import type { PaymentRecord } from "@swigpay/agent-wallet";
import { ExplorerLink } from "./ExplorerLink";
import { formatRelativeTimestamp } from "./time";

const REJECTED_STATUSES = ["rejected", "failed"] as const;

interface TransactionFeedProps {
  payments: PaymentRecord[];
}

function shortHash(value: string) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "—";
}

function statusClasses(status: PaymentRecord["status"]) {
  if (status === "approved") return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "pending_approval") return "border border-yellow-500/20 bg-yellow-500/10 text-yellow-200";
  return "border border-red-500/20 bg-red-500/10 text-red-200";
}

function statusLabel(status: PaymentRecord["status"]) {
  if (status === "pending_approval") return "Pending approval";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface FilterButtonProps {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
  tone: "neutral" | "success" | "warning" | "danger";
}

function FilterButton({ active, count, label, onClick, tone }: FilterButtonProps) {
  const classes =
    tone === "success"
      ? active
        ? "border border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
        : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : tone === "warning"
        ? active
          ? "border border-yellow-400/50 bg-yellow-500/20 text-yellow-100"
          : "border border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
        : tone === "danger"
          ? active
            ? "border border-red-400/50 bg-red-500/20 text-red-100"
            : "border border-red-500/30 bg-red-500/10 text-red-200"
          : active
            ? "border border-gray-600 bg-gray-800 text-white"
            : "border border-gray-700 bg-gray-950 text-gray-200";

  return (
    <button type="button" onClick={onClick} className={`rounded-full px-3 py-1 ${classes}`}>
      {label} ({count})
    </button>
  );
}

export function TransactionFeed({ payments }: TransactionFeedProps) {
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const { approvedCount, pendingCount, rejectedCount, filteredPayments } = useMemo(() => {
    const approved = payments.filter((payment) => payment.status === "approved");
    const pending = payments.filter((payment) => payment.status === "pending_approval");
    const rejected = payments.filter((payment) =>
      REJECTED_STATUSES.includes(payment.status as (typeof REJECTED_STATUSES)[number]),
    );

    const filtered =
      filter === "approved"
        ? approved
        : filter === "pending"
          ? pending
          : filter === "rejected"
            ? rejected
            : payments;

    return {
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      filteredPayments: filtered,
    };
  }, [filter, payments]);

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Transaction feed</h2>
          <p className="mt-1 text-sm text-gray-400">Recent x402 payment activity recorded in the SwigPay SQLite log.</p>
        </div>
        <span className="rounded-full border border-gray-700 bg-gray-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
          {payments.length} records
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.15em]">
        <FilterButton active={filter === "all"} count={payments.length} label="All" onClick={() => setFilter("all")} tone="neutral" />
        <FilterButton active={filter === "approved"} count={approvedCount} label="Approved" onClick={() => setFilter("approved")} tone="success" />
        <FilterButton active={filter === "pending"} count={pendingCount} label="Pending" onClick={() => setFilter("pending")} tone="warning" />
        <FilterButton active={filter === "rejected"} count={rejectedCount} label="Rejected" onClick={() => setFilter("rejected")} tone="danger" />
      </div>

      {filteredPayments.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-gray-700 bg-gray-950/70 p-6 text-sm text-gray-400">
          {payments.length === 0
            ? "No transactions recorded yet. Run `pnpm demo` to generate paid tool calls and explorer links."
            : "No transactions in this filter yet."}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-gray-800">
          <div className="overflow-x-auto">
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
              <tbody className="divide-y divide-gray-800 bg-gray-900/70">
                {filteredPayments.map((payment, index) => (
                  <tr 
                    key={payment.id} 
                    className="transition-all duration-200 hover:bg-gray-800/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-1">
                        <p className="font-medium text-white">{payment.tool}</p>
                        <p className="max-w-md break-all text-xs text-gray-500 font-mono">{payment.endpoint}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top font-medium text-cyan-200">{payment.amountUsdc.toFixed(6)} USDC</td>
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
                    <td className="px-4 py-4 align-top text-xs text-gray-400">
                      {formatRelativeTimestamp(payment.createdAt)}
                      <span className="block text-[11px] text-gray-500">{formatTimestamp(payment.createdAt)}</span>
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
