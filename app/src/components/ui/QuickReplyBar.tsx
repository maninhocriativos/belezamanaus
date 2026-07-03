const replies = ["Agendar avaliacao", "Chamar humano", "Enviar orientacoes"];

type QuickReplyBarProps = {
  onSelect?: (reply: string) => void;
};

export function QuickReplyBar({ onSelect }: QuickReplyBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto border-t border-rosebrand-100 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      {replies.map((reply) => (
        <button className="whitespace-nowrap rounded-full border border-rosebrand-200 px-3 py-1 text-xs font-semibold text-rosebrand-700 transition hover:bg-rosebrand-50 dark:border-zinc-700 dark:text-rosebrand-200 dark:hover:bg-zinc-800" key={reply} onClick={() => onSelect?.(reply)} type="button">
          {reply}
        </button>
      ))}
    </div>
  );
}
