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
  index?: number;
}

const BASE_DELAY = 0;
const STAGGER_MS = 80;

function shortAddress(value: string) {
  return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "—";
}

function formatUsdc(value: number) {
  return `${value.toFixed(value >= 1 ? 3 : 6)} USDC`;
}

export function AgentOverview({ config, spentToday, index = 0 }: AgentOverviewProps) {
  const [expanded, setExpanded] = useState(false);
  const remainingToday = Math.max(0, config.dailyLimitUsdc - spentToday);
  const percentUsed = config.dailyLimitUsdc > 0 ? (spentToday / config.dailyLimitUsdc) * 100 : 0;
  const clusterQuery = `cluster=${config.network}`;
  const sectionDelay = `${BASE_DELAY + index * STAGGER_MS}ms`;

  const isNotConfigured = config.agentAddress === "Not configured";

  if (isNotConfigured) {
    return (
      <section
        className="rounded-2xl border border-gray-800/80 bg-gray-900/80 p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.24)] animate-fade-in-up"
        style={{ animationDelay: sectionDelay }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
            <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Setup Required</h2>
            <p className="text-sm text-gray-400">
              Agent wallet not configured. Run the setup scripts to provision wallets and configure environment variables.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-emerald-500/20 bg-gray-900/80 p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.24)] animate-fade-in-up"
      style={{ animationDelay: sectionDelay }}
    >
      {/* Collapsed header — always visible */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Active
          </span>
          <h2 className="text-lg font-semibold text-white">OpenClaw Agent Wallet</h2>
          <ExplorerLink
            href={`${config.explorerBase}/address/${config.agentAddress}?${clusterQuery}`}
            className="font-mono text-sm text-cyan-300"
          >
            {shortAddress(config.agentAddress)}
          </ExplorerLink>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Remaining today</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{formatUsdc(remainingToday)}</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="rounded-xl border border-gray-700/60 bg-gray-800/40 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            {expanded ? "Hide details ↑" : "Show details →"}
          </button>
        </div>
      </div>

      {/* Daily spend progress bar — always visible */}
      <div className="mt-5 rounded-xl border border-gray-800/60 bg-gray-950/70 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Daily spend usage</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-white">
              {formatUsdc(spentToday)} used of {formatUsdc(config.dailyLimitUsdc)}
            </p>
          </div>
          <p className="text-sm text-gray-400">Solana {config.network}</p>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, percentUsed))}%` }}
          />
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-5 animate-fade-in">
          <p className="mb-4 text-sm text-gray-400">
            Autonomous x402 payments stay inside a Squads spending limit while the dashboard keeps a human-readable audit trail.
          </p>
          <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-gray-800/60 bg-gray-950/70 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Agent address</dt>
              <dd className="mt-2 font-mono text-sm text-white">
                <ExplorerLink href={`${config.explorerBase}/address/${config.agentAddress}?${clusterQuery}`} className="font-mono text-sm">
                  {shortAddress(config.agentAddress)}
                </ExplorerLink>
              </dd>
            </div>
            <div className="rounded-xl border border-gray-800/60 bg-gray-950/70 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Vault PDA</dt>
              <dd className="mt-2 font-mono text-sm text-white">
                <ExplorerLink href={`${config.explorerBase}/address/${config.vaultPda}?${clusterQuery}`} className="font-mono text-sm">
                  {shortAddress(config.vaultPda)}
                </ExplorerLink>
              </dd>
            </div>
            <div className="rounded-xl border border-gray-800/60 bg-gray-950/70 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Multisig PDA</dt>
              <dd className="mt-2 font-mono text-sm text-white">
                <ExplorerLink href={`${config.explorerBase}/address/${config.multisigPda}?${clusterQuery}`} className="font-mono text-sm">
                  {shortAddress(config.multisigPda)}
                </ExplorerLink>
              </dd>
            </div>
            <div className="rounded-xl border border-gray-800/60 bg-gray-950/70 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Spending limit PDA</dt>
              <dd className="mt-2 font-mono text-sm text-white">
                <ExplorerLink href={`${config.explorerBase}/address/${config.spendingLimitPda}?${clusterQuery}`} className="font-mono text-sm">
                  {shortAddress(config.spendingLimitPda)}
                </ExplorerLink>
              </dd>
            </div>
            <div className="rounded-xl border border-gray-800/60 bg-gray-950/70 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Limits</dt>
              <dd className="mt-2 space-y-1 text-sm text-white">
                <p className="tabular-nums">{formatUsdc(config.dailyLimitUsdc)} daily</p>
                <p className="text-gray-400 tabular-nums">{formatUsdc(config.perTxLimitUsdc)} per transaction</p>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
