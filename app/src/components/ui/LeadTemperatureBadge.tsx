export function LeadTemperatureBadge({ temperature }: { temperature: string }) {
  return <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{temperature}</span>;
}
