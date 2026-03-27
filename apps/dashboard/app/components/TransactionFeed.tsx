import { useMemo, useState } from "react";
import type { PaymentRecord } from "@swigpay/agent-wallet";
import { ExplorerLink } from "./ExplorerLink";
import { formatRelativeTimestamp } from "./time";

const REJECTED_STATUSES = ["rejected", "failed"] as const;

interface TransactionFeedProps {
  payments: PaymentRecord[];
}

function shortHash(value: string) {
  return value ? `${value.slice(0, 8)}...${value.slice(-4)}` : "—";
}

function statusClasses(status: PaymentRecord["status"]) {
  if (status === "approved") return "border border-emerald-500/30 bg-emerald-500/15 text-emerald-100";
  if (status === "pending_approval") return "border border-yellow-500/30 bg-yellow-500/15 text-yellow-100";
  return "border border-red-500/30 bg-red-500/15 text-red-100";
}

function statusLabel(status: PaymentRecord["status"]) {
  if (status === "pending_approval") return "Awaiting approval";
  if (status === "approved") return "Confirmed";
  if (status === "rejected") return "Rejected";
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
        : "border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
      : tone === "warning"
        ? active
          ? "border border-yellow-400/50 bg-yellow-500/20 text-yellow-100"
          : "border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
        : tone === "danger"
          ? active
            ? "border border-red-400/50 bg-red-500/20 text-red-100"
            : "border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
          : active
            ? "border border-gray-600 bg-gray-800 text-white"
            : "border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700";

  return (
    <button type="button" onClick={onClick} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${classes}`}>
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
          <p className="mt-1 text-sm text-gray-400">On-chain x402 payments via Squads spending limit</p>
        </div>
        <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-gray-300">
          {payments.length} records
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} count={payments.length} label="All" onClick={() => setFilter("all")} tone="neutral" />
        <FilterButton active={filter === "approved"} count={approvedCount} label="Confirmed" onClick={() => setFilter("approved")} tone="success" />
        <FilterButton active={filter === "pending"} count={pendingCount} label="Pending" onClick={() => setFilter("pending")} tone="warning" />
        <FilterButton active={filter === "rejected"} count={rejectedCount} label="Rejected" onClick={() => setFilter("rejected")} tone="danger" />
      </div>

      {filteredPayments.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-gray-700 bg-gray-950/70 p-6 text-sm text-gray-400">
          {payments.length === 0
            ? "No transactions yet. Run the demo to generate paid tool calls."
            : "No transactions match this filter."}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-950/80 text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] text-gray-500">Tool</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] text-gray-500">Status</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] text-gray-500">On-chain tx</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/70">
                {filteredPayments.map((payment, index) => (
                  <tr 
                    key={payment.id} 
                    className="transition-colors duration-150 hover:bg-gray-800/40"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-white">{payment.tool}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-cyan-200">{payment.amountUsdc.toFixed(6)}</p>
                      <p className="text-xs text-gray-500">USDC</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(payment.status)}`}>
                        {statusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {payment.explorerUrl ? (
                        <ExplorerLink href={payment.explorerUrl} className="font-mono text-xs text-cyan-300 hover:text-cyan-200">
                          {shortHash(payment.txHash)}
                        </ExplorerLink>
                      ) : (
                        <span className="text-sm text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-300">{formatRelativeTimestamp(payment.createdAt)}</p>
                      <p className="text-xs text-gray-500">{formatTimestamp(payment.createdAt)}</p>
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
