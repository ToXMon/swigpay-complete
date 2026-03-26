import { ExplorerLink } from "./ExplorerLink";

interface AgentOverviewProps {
  config: {
    agentAddress: string;
    vaultPda: string;
    multisigPda: string;
    dailyLimitUsdc: number;
    perTxLimitUsdc: number;
    explorerBase: string;
    network: string;
  };
  spentToday: number;
}

const PROGRESS_WIDTHS = [
  { max: 0, className: "w-0" },
  { max: 10, className: "w-[10%]" },
  { max: 20, className: "w-[20%]" },
  { max: 30, className: "w-[30%]" },
  { max: 40, className: "w-[40%]" },
  { max: 50, className: "w-1/2" },
  { max: 60, className: "w-[60%]" },
  { max: 70, className: "w-[70%]" },
  { max: 80, className: "w-[80%]" },
  { max: 90, className: "w-[90%]" },
  { max: 100, className: "w-full" },
] as const;

function shortAddress(value: string) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "—";
}

function formatUsdc(value: number) {
  return `${value.toFixed(value >= 1 ? 3 : 6)} USDC`;
}

function progressWidthClass(percentUsed: number) {
  const safePercent = Number.isFinite(percentUsed) ? Math.max(0, Math.min(100, percentUsed)) : 0;
  return PROGRESS_WIDTHS.find((step) => safePercent <= step.max)?.className ?? "w-full";
}

export function AgentOverview({ config, spentToday }: AgentOverviewProps) {
  const remainingToday = Math.max(0, config.dailyLimitUsdc - spentToday);
  const percentUsed = config.dailyLimitUsdc > 0 ? (spentToday / config.dailyLimitUsdc) * 100 : 0;
  const progressClassName = progressWidthClass(percentUsed);
  const clusterQuery = `cluster=${config.network}`;

  return (
    <section className="mb-6 rounded-2xl border border-emerald-500/20 bg-gray-900/80 p-6 shadow-[0_0_0_1px_rgba(16,185,129,0.03)] backdrop-blur">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-white">OpenClaw Agent Wallet</h2>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Active
            </span>
          </div>
          <p className="max-w-2xl text-sm text-gray-400">
            Autonomous x402 payments stay inside a Squads spending limit while the dashboard keeps a human-readable audit trail.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Remaining today</p>
          <p className="mt-2 text-xl font-semibold text-white">{formatUsdc(remainingToday)}</p>
          <p className="mt-1 text-xs text-gray-400">{percentUsed.toFixed(0)}% of the daily budget used</p>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
          <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Agent address</dt>
          <dd className="mt-3 font-mono text-sm text-white">
            <ExplorerLink href={`${config.explorerBase}/address/${config.agentAddress}?${clusterQuery}`} className="font-mono text-sm">
              {shortAddress(config.agentAddress)}
            </ExplorerLink>
          </dd>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
          <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Vault PDA</dt>
          <dd className="mt-3 font-mono text-sm text-white">
            <ExplorerLink href={`${config.explorerBase}/address/${config.vaultPda}?${clusterQuery}`} className="font-mono text-sm">
              {shortAddress(config.vaultPda)}
            </ExplorerLink>
          </dd>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
          <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Multisig PDA</dt>
          <dd className="mt-3 font-mono text-sm text-white">
            <ExplorerLink href={`${config.explorerBase}/address/${config.multisigPda}?${clusterQuery}`} className="font-mono text-sm">
              {shortAddress(config.multisigPda)}
            </ExplorerLink>
          </dd>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
          <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Limits</dt>
          <dd className="mt-3 space-y-1 text-sm text-white">
            <p>{formatUsdc(config.dailyLimitUsdc)} daily</p>
            <p className="text-gray-400">{formatUsdc(config.perTxLimitUsdc)} per transaction</p>
          </dd>
        </div>
      </dl>

      <div className="mt-6 rounded-xl border border-gray-800 bg-gray-950/70 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Daily spend usage</p>
            <p className="mt-2 text-base font-semibold text-white">
              {formatUsdc(spentToday)} used of {formatUsdc(config.dailyLimitUsdc)}
            </p>
          </div>
          <p className="text-sm text-gray-400">Solana {config.network}</p>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-800">
          <div className={`h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all duration-500 ${progressClassName}`} />
        </div>
      </div>
    </section>
  );
}
