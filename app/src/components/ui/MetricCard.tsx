type MetricCardProps = {
  label: string;
  value: string;
  trend: string;
};

export function MetricCard({ label, value, trend }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-rosebrand-100 bg-white p-4 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <strong className="text-2xl">{value}</strong>
        <span className="rounded-full bg-rosebrand-50 px-2.5 py-1 text-xs font-semibold text-rosebrand-700 dark:bg-rosebrand-950 dark:text-rosebrand-200">
          {trend}
        </span>
      </div>
    </article>
  );
}
