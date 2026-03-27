import { useState } from "react";
import { ExplorerLink } from "./ExplorerLink";

interface AgentOverviewProps {
  config: {
    agentAddress: string;
    vaultPda: string;
    multisigPda: string;
    spendingLimitPda: string;
    dailyLimitUsdc: number;
    perTxLimitUsdc: number;
    explorerBase: string;
    network: string;
  };
  spentToday: number;
}

function shortAddress(value: string) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "—";
}

function formatUsdc(value: number) {
  return `${value.toFixed(value >= 1 ? 3 : 6)} USDC`;
}

export function AgentOverview({ config, spentToday }: AgentOverviewProps) {
  const remainingToday = Math.max(0, config.dailyLimitUsdc - spentToday);
  const percentUsed = config.dailyLimitUsdc > 0 ? (spentToday / config.dailyLimitUsdc) * 100 : 0;
  const clusterQuery = `cluster=${config.network}`;
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <section className="mb-6 rounded-2xl border border-emerald-500/20 bg-gray-900/80 p-6 backdrop-blur">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <h2 className="text-lg font-semibold text-white">OpenClaw Agent Wallet</h2>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-300">
              Active
            </span>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-gray-300">
            Autonomous x402 payments routed through Squads v4 spending limits with human oversight.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-emerald-300">Remaining today</p>
          <p className="mt-2 text-xl font-bold text-white">{formatUsdc(remainingToday)}</p>
          <p className="mt-1 text-xs text-gray-400">{percentUsed.toFixed(0)}% of daily budget used</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDetailsOpen((value) => !value)}
        className="mt-5 text-sm font-medium text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
      >
        {detailsOpen ? "Hide details" : "Show on-chain details"}
      </button>

      {detailsOpen && (
        <dl className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
            <dt className="text-xs font-medium uppercase tracking-[0.15em] text-gray-500">Agent address</dt>
            <dd className="mt-2">
              <ExplorerLink href={`${config.explorerBase}/address/${config.agentAddress}?${clusterQuery}`} className="font-mono text-sm text-white">
                {shortAddress(config.agentAddress)}
              </ExplorerLink>
            </dd>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
            <dt className="text-xs font-medium uppercase tracking-[0.15em] text-gray-500">Vault PDA</dt>
            <dd className="mt-2">
              <ExplorerLink href={`${config.explorerBase}/address/${config.vaultPda}?${clusterQuery}`} className="font-mono text-sm text-white">
                {shortAddress(config.vaultPda)}
              </ExplorerLink>
            </dd>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
            <dt className="text-xs font-medium uppercase tracking-[0.15em] text-gray-500">Multisig PDA</dt>
            <dd className="mt-2">
              <ExplorerLink href={`${config.explorerBase}/address/${config.multisigPda}?${clusterQuery}`} className="font-mono text-sm text-white">
                {shortAddress(config.multisigPda)}
              </ExplorerLink>
            </dd>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
            <dt className="text-xs font-medium uppercase tracking-[0.15em] text-gray-500">Spending limit</dt>
            <dd className="mt-2">
              <ExplorerLink href={`${config.explorerBase}/address/${config.spendingLimitPda}?${clusterQuery}`} className="font-mono text-sm text-white">
                {shortAddress(config.spendingLimitPda)}
              </ExplorerLink>
            </dd>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
            <dt className="text-xs font-medium uppercase tracking-[0.15em] text-gray-500">Policy limits</dt>
            <dd className="mt-2 space-y-1">
              <p className="text-sm font-medium text-white">{formatUsdc(config.dailyLimitUsdc)} daily</p>
              <p className="text-sm text-gray-400">{formatUsdc(config.perTxLimitUsdc)} per tx</p>
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-5 rounded-xl border border-gray-800 bg-gray-950/70 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-500">Daily spend</p>
            <p className="mt-2 text-base font-semibold text-white">
              {formatUsdc(spentToday)} of {formatUsdc(config.dailyLimitUsdc)}
            </p>
          </div>
          <p className="text-sm text-gray-400">Solana {config.network}</p>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-800">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all duration-700" 
            style={{ width: `${Math.max(0, Math.min(100, percentUsed))}%` }}
          />
        </div>
      </div>
    </section>
  );
}
