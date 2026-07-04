import { LeadStatusBadge } from "./LeadStatusBadge";
import { LeadTemperatureBadge } from "./LeadTemperatureBadge";
import type { ChatConversation } from "./ConversationList";

type LeadDetailsPanelProps = {
  conversation?: ChatConversation;
};

function contactName(conversation?: ChatConversation) {
  if (!conversation) return "Lead";
  if (conversation.contact_name) return conversation.contact_name;
  const [channel, identifier] = conversation.id.includes(":") ? conversation.id.split(":") : ["crm", conversation.id];
  if (channel === "facebook") return `Facebook ${identifier}`;
  if (channel === "instagram") return `Instagram ${identifier}`;
  if (channel === "whatsapp") return `WhatsApp ${identifier}`;
  return identifier.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function contactInitial(conversation?: ChatConversation) {
  return contactName(conversation)[0] || "L";
}

export function LeadDetailsPanel({ conversation }: LeadDetailsPanelProps) {
  function notify(action: string) {
    window.dispatchEvent(new CustomEvent("crm-action", { detail: action }));
  }

  return (
    <aside className="hidden min-h-0 flex-col bg-white dark:bg-zinc-950 xl:flex">
      <header className="flex h-16 items-center border-b border-rosebrand-100 px-4 dark:border-zinc-800">
        <h3 className="text-base font-semibold">Dados do lead</h3>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center border-b border-rosebrand-100 pb-5 text-center dark:border-zinc-800">
          {conversation?.contact_avatar_url ? (
            <img alt={contactName(conversation)} className="size-20 rounded-full object-cover" src={conversation.contact_avatar_url} />
          ) : (
            <span className="grid size-20 place-items-center rounded-full bg-rosebrand-100 text-2xl font-bold text-rosebrand-700">{contactInitial(conversation)}</span>
          )}
          <h4 className="mt-3 font-semibold">{contactName(conversation)}</h4>
          <p className="text-xs text-zinc-500">{conversation?.contact_phone || conversation?.lead_id || "sem telefone"}</p>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <p><strong>Origem:</strong> {conversation?.channel || conversation?.sender_type || "Meta Leads"}</p>
          <p><strong>Campanha:</strong> Avaliacao Julho</p>
          <p><strong>Formulario:</strong> Avaliacao gratuita</p>
          <p><strong>Atendente:</strong> Aline</p>
        </div>
        <div className="flex gap-2">
          <LeadStatusBadge status="Em atendimento" />
          <LeadTemperatureBadge temperature="Quente" />
        </div>
        <div className="mt-5 space-y-2">
          <button className="w-full rounded-lg bg-rosebrand-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => notify("Lead marcado como venda em rascunho.")} type="button">Marcar venda</button>
          <button className="w-full rounded-lg border border-rosebrand-100 px-3 py-2 text-sm font-semibold text-rosebrand-700" onClick={() => notify("Retorno agendado para este lead.")} type="button">Agendar retorno</button>
          <button className="w-full rounded-lg border border-rosebrand-100 px-3 py-2 text-sm font-semibold text-zinc-700" onClick={() => notify("Atendimento transferido para especialista.")} type="button">Transferir atendimento</button>
        </div>
      </div>
    </aside>
  );
}
