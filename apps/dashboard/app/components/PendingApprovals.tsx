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
  if (payments.length === 0) {
    return (
      <section className="mb-6 rounded-2xl border border-gray-800 bg-gray-900/80 p-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Pending approvals</h2>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          No payments are waiting for approval. Transactions under the threshold settle automatically.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6 shadow-[0_0_32px_rgba(251,191,36,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400" />
            <h2 className="text-lg font-semibold text-white">Approval required</h2>
          </div>
          <p className="mt-1 text-sm text-gray-300">
            {payments.length} payment{payments.length > 1 ? "s" : ""} exceed the auto-approval threshold and need human review.
          </p>
        </div>
        <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-amber-300">
          {payments.length} waiting
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {payments.map((payment) => {
          const isCurrentPayment = busyAction?.id === payment.id;
          const approving = isCurrentPayment && busyAction?.action === "approve";
          const rejecting = isCurrentPayment && busyAction?.action === "reject";
          const disabled = !payment.id || Boolean(isCurrentPayment);

          return (
            <div key={payment.id} className="rounded-xl border border-amber-500/20 bg-gray-950/80 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-white">{payment.tool}</p>
                    <span className="rounded-lg bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-200">
                      {payment.amountUsdc.toFixed(6)} USDC
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Requested {formatRelativeTimestamp(payment.createdAt)} &middot; {formatTimestamp(payment.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => payment.id && onAction(payment.id, "approve")}
                    className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-2.5 text-sm font-semibold text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition hover:bg-emerald-500/30 hover:shadow-[0_0_28px_rgba(16,185,129,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {approving ? "Approving..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => payment.id && onAction(payment.id, "reject")}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {rejecting ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
