import { Archive, Facebook, Instagram, MessageSquarePlus, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";

export type ChatConversation = {
  id: string;
  last_message: string | null;
  last_message_at: string | null;
  last_message_type: string | null;
  lead_id: string;
  sender_type: string | null;
  status: string;
};

type ConversationListProps = {
  onSelect: (conversation: ChatConversation) => void;
  selectedConversationId: string;
};

const fallbackConversations: ChatConversation[] = [
  {
    id: "marina-alves",
    last_message: "Quero saber sobre avaliacao",
    last_message_at: new Date().toISOString(),
    last_message_type: "text",
    lead_id: "lead-marina-alves",
    sender_type: "meta",
    status: "open"
  }
];

function formatTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function titleFromConversation(id: string) {
  const [channel, identifier] = id.includes(":") ? id.split(":") : ["chat", id];
  if (channel === "whatsapp") return `WhatsApp ${identifier}`;
  if (channel === "instagram") return `Instagram ${identifier}`;
  if (channel === "facebook") return `Facebook ${identifier}`;
  return identifier.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function channelFromConversation(id: string) {
  if (id.startsWith("whatsapp:")) return { color: "bg-emerald-500", icon: null, label: "WhatsApp" };
  if (id.startsWith("instagram:")) return { color: "bg-pink-500", icon: Instagram, label: "Instagram" };
  if (id.startsWith("facebook:")) return { color: "bg-blue-600", icon: Facebook, label: "Facebook" };
  return { color: "bg-rosebrand-600", icon: null, label: "CRM" };
}

function previewFromConversation(item: ChatConversation) {
  if (item.last_message) return item.last_message;
  if (item.last_message_type === "image") return "Foto recebida";
  if (item.last_message_type === "video") return "Video recebido";
  if (item.last_message_type === "audio") return "Audio recebido";
  if (item.last_message_type === "document") return "Documento recebido";
  return "Nova mensagem";
}

export function ConversationList({ onSelect, selectedConversationId }: ConversationListProps) {
  const [conversations, setConversations] = useState(fallbackConversations);
  const [syncing, setSyncing] = useState(false);

  async function loadConversations(selectFirstWhenMissing = false) {
    const data = await apiFetch<{ conversations: ChatConversation[] }>("/chat/conversations");
    if (data.conversations.length > 0) {
      setConversations(data.conversations);
      if (selectFirstWhenMissing && !data.conversations.some((conversation) => conversation.id === selectedConversationId)) {
        onSelect(data.conversations[0]);
      }
    }
  }

  async function syncMessenger() {
    setSyncing(true);
    try {
      await apiFetch("/chat/sync", { method: "POST" });
      await loadConversations(true);
    } catch {
      await loadConversations(false).catch(() => setConversations(fallbackConversations));
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    syncMessenger();
  }, []);

  return (
    <aside className="flex min-h-0 flex-col border-r border-rosebrand-100 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex h-16 items-center justify-between border-b border-rosebrand-100 px-4 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-semibold">Conversas</h3>
          <p className="text-xs text-zinc-500">5 atendimentos ativos</p>
        </div>
        <div className="flex gap-1">
          <button className="rounded-lg p-2 text-zinc-500 hover:bg-rosebrand-50 dark:hover:bg-zinc-900" title="Nova conversa" type="button">
            <MessageSquarePlus size={18} />
          </button>
          <button className="rounded-lg p-2 text-zinc-500 hover:bg-rosebrand-50 disabled:opacity-60 dark:hover:bg-zinc-900" disabled={syncing} onClick={syncMessenger} title="Sincronizar Messenger" type="button">
            <RefreshCw className={syncing ? "animate-spin" : ""} size={18} />
          </button>
          <button className="rounded-lg p-2 text-zinc-500 hover:bg-rosebrand-50 dark:hover:bg-zinc-900" onClick={() => setConversations((current) => current.filter((item) => item.status !== "archived"))} title="Arquivadas" type="button">
            <Archive size={18} />
          </button>
        </div>
      </header>

      <div className="border-b border-rosebrand-100 p-3 dark:border-zinc-800">
        <label className="flex items-center gap-2 rounded-lg bg-rosebrand-50 px-3 py-2 text-sm text-zinc-500 dark:bg-zinc-900">
          <Search size={16} />
          <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Buscar conversa" />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.map((item) => {
          const channel = channelFromConversation(item.id);
          const ChannelIcon = channel.icon;
          return (
          <button
            className={`flex w-full items-center gap-3 border-b border-rosebrand-50 px-4 py-3 text-left transition dark:border-zinc-900 ${
              item.id === selectedConversationId ? "bg-rosebrand-50 dark:bg-zinc-900" : "hover:bg-rosebrand-50/70 dark:hover:bg-zinc-900"
            }`}
            key={item.id}
            onClick={() => onSelect(item)}
            type="button"
          >
            <span className="relative grid size-12 place-items-center rounded-full bg-rosebrand-100 text-base font-semibold text-rosebrand-700">
              {ChannelIcon ? <ChannelIcon size={19} /> : titleFromConversation(item.id)[0]}
              <span className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${channel.color}`} />
            </span>
            <span className="min-w-0 flex-1 space-y-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{titleFromConversation(item.id)}</span>
                <span className="shrink-0 text-[11px] text-zinc-500">{formatTime(item.last_message_at)}</span>
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-zinc-500">{previewFromConversation(item)}</span>
              </span>
              <span className="block text-[11px] font-medium text-rosebrand-600">{channel.label} · {item.status}</span>
            </span>
          </button>
        );
        })}
      </div>
    </aside>
  );
}
