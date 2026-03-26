import type { PaymentRecord } from "@swigpay/agent-wallet";
import { relativeTime } from "../dashboardData";

interface PendingApprovalsProps {
  busyAction: { id: number; action: "approve" | "reject" } | null;
  onAction: (id: number, action: "approve" | "reject") => Promise<void>;
  payments: PaymentRecord[];
  index?: number;
}

const BASE_DELAY = 0;
const STAGGER_MS = 80;

export function PendingApprovals({ busyAction, onAction, payments, index = 0 }: PendingApprovalsProps) {
  const hasPending = payments.length > 0;
  const sectionDelay = `${BASE_DELAY + index * STAGGER_MS}ms`;

  return (
    <section
      className={`rounded-2xl border p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.24)] animate-fade-in-up ${
        hasPending
          ? "border-amber-500/30 bg-gray-900/80 animate-pulse-glow-amber"
          : "border-emerald-500/10 bg-emerald-500/[0.02]"
      }`}
      style={{ animationDelay: sectionDelay }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {hasPending ? "🛡️ Approval Required" : "✓ All clear — no payments waiting for approval"}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {hasPending
              ? "These payments exceed the auto-approval threshold and need your decision before settlement."
              : "Payments under the threshold settle automatically. You'll see items here when human review is needed."}
          </p>
        </div>
        {hasPending && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            {payments.length} queued
          </span>
        )}
      </div>

      {!hasPending ? null : (
        <div className="mt-5 space-y-3">
          {payments.map((payment, i) => {
            const isCurrentPayment = busyAction?.id === payment.id;
            const approving = isCurrentPayment && busyAction?.action === "approve";
            const rejecting = isCurrentPayment && busyAction?.action === "reject";
            const disabled = !payment.id || Boolean(isCurrentPayment);
            const cardDelay = `${BASE_DELAY + (index + 1 + i) * STAGGER_MS}ms`;

            return (
              <div
                key={payment.id}
                className="rounded-xl border border-gray-800/60 bg-gray-950/70 p-4 animate-slide-in-right"
                style={{ animationDelay: cardDelay }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-white">{payment.tool}</p>
                      <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-sm font-bold tabular-nums text-cyan-200">
                        {payment.amountUsdc.toFixed(6)} USDC
                      </span>
                    </div>
                    <p className="max-w-[400px] truncate font-mono text-sm text-gray-500" title={payment.endpoint}>
                      {payment.endpoint}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>{relativeTime(payment.createdAt)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-amber-400/70">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Human review required
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => payment.id && onAction(payment.id, "approve")}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-6 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {approving ? "Approving…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => payment.id && onAction(payment.id, "reject")}
                      className="rounded-xl border border-red-500/20 bg-transparent px-4 py-2.5 text-sm font-medium text-red-300/80 transition hover:bg-red-500/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {rejecting ? "Rejecting…" : "Reject"}
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
