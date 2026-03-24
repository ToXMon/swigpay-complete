"use client";
import { useEffect, useState } from "react";
import type { PaymentRecord } from "@swigpay/agent-wallet";

interface AgentData {
  config: {
    agentAddress: string;
    vaultPda: string;
    multisigPda: string;
    dailyLimitUsdc: number;
    perTxLimitUsdc: number;
    explorerBase: string;
    network: string;
  };
  payments: PaymentRecord[];
}

interface PaymentsResponse {
  payments: PaymentRecord[];
}

function ExplorerLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-mono text-xs">{children}</a>;
}

function shortAddr(addr: string) { return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—"; }

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json() as Promise<T>;
}

export default function Dashboard() {
  const [data, setData] = useState<AgentData | null>(null);
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [agentRes, txRes] = await Promise.all([
      fetchJson<AgentData>("/api/agents"),
      fetchJson<PaymentsResponse>("/api/transactions"),
    ]);
    setData(agentRes);
    setAllPayments(txRes.payments);
    setLoading(false);
  };

  useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, []);

  const handleApprove = async (id: number, action: "approve" | "reject") => {
    await fetch("/api/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    refresh();
  };

  if (loading) return <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">Loading SwigPay...</div>;

  const pending = allPayments.filter(p => p.status === "pending_approval");
  const spentToday = allPayments.filter(p => p.status === "approved" && p.createdAt?.startsWith(new Date().toISOString().split("T")[0])).reduce((s, p) => s + p.amountUsdc, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 font-mono">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-green-400">SwigPay</h1>
          <p className="text-gray-400 text-sm">OpenClaw Agent Smart Wallet Dashboard · Squads v4 · Solana Devnet</p>
          <p className="text-gray-600 text-xs mt-1">Penn Blockchain Conference Hackathon 2026 — Bounty 1 + Bounty 3</p>
        </div>

        {/* Agent Card */}
        {data && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-green-300 font-semibold">OpenClaw Agent</h2>
              <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded">ACTIVE</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Agent Address</p>
                <ExplorerLink href={`${data.config.explorerBase}/address/${data.config.agentAddress}?cluster=${data.config.network}`}>{shortAddr(data.config.agentAddress)}</ExplorerLink>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Squads Vault PDA</p>
                <ExplorerLink href={`${data.config.explorerBase}/address/${data.config.vaultPda}?cluster=${data.config.network}`}>{shortAddr(data.config.vaultPda)}</ExplorerLink>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Daily Spent / Limit</p>
                <p className="text-yellow-300">{spentToday.toFixed(4)} / {data.config.dailyLimitUsdc} USDC</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Per-Tx Limit</p>
                <p className="text-yellow-300">{data.config.perTxLimitUsdc} USDC</p>
              </div>
            </div>
            <div className="mt-3 bg-gray-800 rounded h-2">
              <div className="bg-green-500 h-2 rounded" style={{ width: `${Math.min(100, (spentToday / data.config.dailyLimitUsdc) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Pending Approvals */}
        {pending.length > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-5 mb-6">
            <h2 className="text-yellow-300 font-semibold mb-3">⚠️ Pending Approvals ({pending.length})</h2>
            {pending.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-yellow-900/50 text-sm">
                <div>
                  <span className="text-white">{p.tool}</span>
                  <span className="text-yellow-300 ml-3">{p.amountUsdc.toFixed(6)} USDC</span>
                  <span className="text-gray-500 ml-3 text-xs">{p.createdAt}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(p.id!, "approve")} className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs">Approve</button>
                  <button onClick={() => handleApprove(p.id!, "reject")} className="bg-red-800 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transaction Feed */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
          <h2 className="text-gray-300 font-semibold mb-4">Transaction Feed ({allPayments.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left pb-2">Tool</th>
                  <th className="text-left pb-2">Amount</th>
                  <th className="text-left pb-2">Status</th>
                  <th className="text-left pb-2">Tx</th>
                  <th className="text-left pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {allPayments.map(p => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 text-white">{p.tool}</td>
                    <td className="py-2 text-yellow-300">{p.amountUsdc.toFixed(6)} USDC</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        p.status === "approved" ? "bg-green-900 text-green-300" :
                        p.status === "pending_approval" ? "bg-yellow-900 text-yellow-300" :
                        "bg-red-900 text-red-300"
                      }`}>{p.status}</span>
                    </td>
                    <td className="py-2">{p.explorerUrl ? <ExplorerLink href={p.explorerUrl}>{shortAddr(p.txHash)}</ExplorerLink> : "—"}</td>
                    <td className="py-2 text-gray-500">{p.createdAt?.split("T")[1]?.split(".")[0] ?? "—"}</td>
                  </tr>
                ))}
                {allPayments.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-600">No transactions yet. Run: pnpm demo</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
