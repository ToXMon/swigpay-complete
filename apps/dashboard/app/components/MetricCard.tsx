interface MetricCardProps {
  title: string;
  value: string;
  caption: string;
  tone?: "default" | "success" | "warning" | "info";
  index?: number;
}

export function MetricCard({
  title,
  value,
  caption,
  tone = "default",
  index = 0,
}: MetricCardProps) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/5"
      : tone === "warning"
        ? "border-yellow-500/20 bg-yellow-500/5"
        : tone === "info"
          ? "border-cyan-500/20 bg-cyan-500/5"
          : "border-gray-800 bg-gray-900/80";

  const animationDelay = `${index * 100}ms`;

  return (
    <div 
      className={`rounded-2xl border p-5 shadow-[0_12px_30px_rgba(0,0,0,0.18)] ${toneClasses} animate-fade-in-up`}
      style={{ animationDelay }}
    >
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1.5 text-sm leading-snug text-gray-300">{caption}</p>
    </div>
  );
}
