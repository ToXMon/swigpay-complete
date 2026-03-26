import type { PaymentRecord } from "@swigpay/agent-wallet";
import { formatRelativeTimestamp } from "./time";

interface PendingApprovalsProps {
  busyAction: { id: number; action: "approve" | "reject" } | null;
  onAction: (id: number, action: "approve" | "reject") => Promise<void>;
  payments: PaymentRecord[];
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PendingApprovals({ busyAction, onAction, payments }: PendingApprovalsProps) {
  return (
    <section className={`mb-6 rounded-2xl p-6 ${payments.length > 0 ? "border border-amber-400/40 bg-amber-500/10 shadow-[0_0_28px_rgba(251,191,36,0.18)]" : "border border-yellow-500/20 bg-yellow-500/5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{payments.length > 0 ? "🛡️ Approval Required" : "Pending approvals"}</h2>
          <p className="mt-1 text-sm text-gray-400">
            {payments.length > 0 ? "Payments above the auto-approval threshold are awaiting a human decision." : "Payments above the auto-approval threshold wait here for a human decision."}
          </p>
        </div>
        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">
          {payments.length} queued
        </span>
      </div>

      {payments.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-yellow-500/20 bg-gray-950/60 p-5 text-sm text-gray-400">
          <p className="font-medium text-emerald-200">All clear</p>
          <p className="mt-1">No approvals are waiting right now. Demo payments under the configured threshold will settle automatically.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {payments.map((payment) => {
            const isCurrentPayment = busyAction?.id === payment.id;
            const approving = isCurrentPayment && busyAction?.action === "approve";
            const rejecting = isCurrentPayment && busyAction?.action === "reject";
            const disabled = !payment.id || Boolean(isCurrentPayment);

            return (
              <div key={payment.id} className="rounded-xl border border-yellow-500/20 bg-gray-950/70 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium text-white">{payment.tool}</p>
                      <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-semibold text-yellow-300">
                        {payment.amountUsdc.toFixed(6)} USDC
                      </span>
                    </div>
                    <p className="break-all text-sm text-gray-400">{payment.endpoint}</p>
                    <p className="text-xs text-gray-500">
                      Requested {formatRelativeTimestamp(payment.createdAt)} · {formatTimestamp(payment.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => payment.id && onAction(payment.id, "approve")}
                      className="rounded-lg border border-emerald-400/40 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {approving ? "Approving..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => payment.id && onAction(payment.id, "reject")}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {rejecting ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
