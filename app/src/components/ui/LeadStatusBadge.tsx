export function LeadStatusBadge({ status }: { status: string }) {
  return <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{status}</span>;
}
