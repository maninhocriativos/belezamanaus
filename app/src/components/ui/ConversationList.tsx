import { Archive, MessageSquarePlus, Search } from "lucide-react";

const conversations = [
  { name: "Marina Alves", message: "Quero saber sobre avaliacao", time: "13:42", unread: 3, status: "online", selected: true },
  { name: "Claudia N.", message: "Pode me passar os horarios?", time: "12:18", unread: 0, status: "aguardando", selected: false },
  { name: "Renata Lima", message: "Enviei uma foto", time: "11:57", unread: 1, status: "quente", selected: false },
  { name: "Patricia Souza", message: "Obrigada, vou ver e retorno", time: "Ontem", unread: 0, status: "retorno", selected: false },
  { name: "Bianca Rocha", message: "Audio recebido", time: "Ontem", unread: 0, status: "novo", selected: false }
];

export function ConversationList() {
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
          <button className="rounded-lg p-2 text-zinc-500 hover:bg-rosebrand-50 dark:hover:bg-zinc-900" title="Arquivadas" type="button">
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
        {conversations.map((item) => (
          <button
            className={`flex w-full items-center gap-3 border-b border-rosebrand-50 px-4 py-3 text-left transition dark:border-zinc-900 ${
              item.selected ? "bg-rosebrand-50 dark:bg-zinc-900" : "hover:bg-rosebrand-50/70 dark:hover:bg-zinc-900"
            }`}
            key={item.name}
            type="button"
          >
            <span className="relative grid size-12 place-items-center rounded-full bg-rosebrand-100 text-base font-semibold text-rosebrand-700">
              {item.name[0]}
              <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500" />
            </span>
            <span className="min-w-0 flex-1 space-y-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{item.name}</span>
                <span className="shrink-0 text-[11px] text-zinc-500">{item.time}</span>
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-zinc-500">{item.message}</span>
                {item.unread > 0 && <span className="grid size-5 shrink-0 place-items-center rounded-full bg-rosebrand-600 text-[11px] font-bold text-white">{item.unread}</span>}
              </span>
              <span className="block text-[11px] font-medium text-rosebrand-600">{item.status}</span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
