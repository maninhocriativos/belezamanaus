const conversations = [
  { name: "Marina Alves", message: "Quero saber sobre avaliacao", unread: 3 },
  { name: "Claudia N.", message: "Pode me passar os horarios?", unread: 0 },
  { name: "Renata Lima", message: "Enviei uma foto", unread: 1 }
];

export function ConversationList() {
  return (
    <aside className="rounded-lg border border-rosebrand-100 bg-white p-4 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-base font-semibold">Conversas</h3>
      <div className="space-y-2">
        {conversations.map((item) => (
          <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-rosebrand-50 dark:hover:bg-zinc-800" key={item.name} type="button">
            <span className="grid size-10 place-items-center rounded-full bg-rosebrand-100 font-semibold text-rosebrand-700">{item.name[0]}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{item.name}</span>
              <span className="block truncate text-xs text-zinc-500">{item.message}</span>
            </span>
            {item.unread > 0 && <span className="rounded-full bg-rosebrand-600 px-2 py-0.5 text-xs text-white">{item.unread}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
}
