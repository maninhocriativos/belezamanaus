type ChartCardProps = {
  bars?: Array<{ label: string; value: number }>;
  note?: string;
  title: string;
};

const defaultBars: Array<{ label: string; value: number }> = [];

export function ChartCard({ bars = defaultBars, note = "dados reais", title }: ChartCardProps) {
  const maxValue = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <article className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="text-xs font-medium text-zinc-500">{note}</span>
      </div>
      <div className="flex h-56 items-end gap-3">
        {bars.length === 0 && (
          <div className="grid h-full w-full place-items-center rounded-lg bg-rosebrand-50 text-sm text-zinc-500 dark:bg-zinc-950">
            Sem dados para o periodo.
          </div>
        )}
        {bars.map((bar) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={bar.label}>
            <div className="w-full rounded-t-md bg-rosebrand-500" style={{ height: `${Math.max(8, (bar.value / maxValue) * 100)}%` }} />
            <span className="text-xs text-zinc-500">{bar.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
