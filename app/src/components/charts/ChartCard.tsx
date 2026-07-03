type ChartCardProps = {
  title: string;
};

const bars = [52, 72, 44, 86, 64, 96, 70];

export function ChartCard({ title }: ChartCardProps) {
  return (
    <article className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="text-xs font-medium text-zinc-500">MVP mock</span>
      </div>
      <div className="flex h-56 items-end gap-3">
        {bars.map((height, index) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={height + index}>
            <div className="w-full rounded-t-md bg-rosebrand-500" style={{ height: `${height}%` }} />
            <span className="text-xs text-zinc-500">D{index + 1}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
