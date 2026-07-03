import { LeadStatusBadge } from "./LeadStatusBadge";
import { LeadTemperatureBadge } from "./LeadTemperatureBadge";

export function LeadDetailsPanel() {
  return (
    <aside className="rounded-lg border border-rosebrand-100 bg-white p-4 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-semibold">Detalhe do lead</h3>
      <div className="mt-4 space-y-3 text-sm">
        <p><strong>Nome:</strong> Marina Alves</p>
        <p><strong>Origem:</strong> Meta Leads</p>
        <p><strong>Campanha:</strong> Avaliacao Julho</p>
        <div className="flex gap-2">
          <LeadStatusBadge status="Em atendimento" />
          <LeadTemperatureBadge temperature="Quente" />
        </div>
      </div>
    </aside>
  );
}
