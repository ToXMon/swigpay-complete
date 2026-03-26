interface MetricCardProps {
  title: string;
  value: string;
  caption: string;
  tone?: "default" | "success" | "warning" | "info";
}

export function MetricCard({
  title,
  value,
  caption,
  tone = "default",
}: MetricCardProps) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/5"
      : tone === "warning"
        ? "border-yellow-500/20 bg-yellow-500/5"
        : tone === "info"
          ? "border-cyan-500/20 bg-cyan-500/5"
          : "border-gray-800 bg-gray-900/80";

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)] ${toneClasses}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-gray-400">{caption}</p>
    </div>
  );
}
