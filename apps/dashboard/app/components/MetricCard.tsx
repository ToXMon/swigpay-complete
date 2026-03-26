interface MetricCardProps {
  title: string;
  value: string;
  caption: string;
  tone?: "default" | "success" | "warning" | "info";
  index?: number;
}

const BASE_DELAY = 0;
const STAGGER_MS = 80;

const TONE_STYLES = {
  default: {
    accent: "border-t-gray-600",
    card: "border-gray-800/80 bg-gray-900/80",
  },
  success: {
    accent: "border-t-emerald-400",
    card: "border-gray-800/80 bg-gray-900/80",
  },
  warning: {
    accent: "border-t-amber-400",
    card: "border-gray-800/80 bg-gray-900/80",
  },
  info: {
    accent: "border-t-cyan-400",
    card: "border-gray-800/80 bg-gray-900/80",
  },
} as const;

export function MetricCard({
  title,
  value,
  caption,
  tone = "default",
  index = 0,
}: MetricCardProps) {
  const { accent, card } = TONE_STYLES[tone];
  const animationDelay = `${BASE_DELAY + index * STAGGER_MS}ms`;

  return (
    <div
      className={`rounded-2xl border border-t-2 ${accent} ${card} backdrop-blur-sm p-4 shadow-[0_8px_32px_rgba(0,0,0,0.24)] animate-fade-in-up`}
      style={{ animationDelay }}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-2 text-sm text-gray-400">{caption}</p>
    </div>
  );
}
