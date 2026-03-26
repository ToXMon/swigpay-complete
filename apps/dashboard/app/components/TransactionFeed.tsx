import type { PaymentRecord } from "@swigpay/agent-wallet";
import { ExplorerLink } from "./ExplorerLink";

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

export function TransactionFeed({ payments }: TransactionFeedProps) {
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

      {payments.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-gray-700 bg-gray-950/70 p-6 text-sm text-gray-400">
          No transactions recorded yet. Run `pnpm demo` to generate paid tool calls and explorer links.
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
                {payments.map((payment, index) => (
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
                    <td className="px-4 py-4 align-top text-xs text-gray-400">{formatTimestamp(payment.createdAt)}</td>
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
