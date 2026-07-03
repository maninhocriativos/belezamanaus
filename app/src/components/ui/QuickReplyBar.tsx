const replies = ["Agendar avaliacao", "Chamar humano", "Enviar orientacoes"];

export function QuickReplyBar() {
  return (
    <div className="flex gap-2 overflow-x-auto border-t border-rosebrand-100 px-3 py-2 dark:border-zinc-800">
      {replies.map((reply) => (
        <button className="whitespace-nowrap rounded-full border border-rosebrand-200 px-3 py-1 text-xs font-semibold text-rosebrand-700 dark:border-zinc-700 dark:text-rosebrand-200" key={reply} type="button">
          {reply}
        </button>
      ))}
    </div>
  );
}
