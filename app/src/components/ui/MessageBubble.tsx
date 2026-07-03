export function MessageBubble({ direction, text }: { direction: "in" | "out"; text: string }) {
  const outgoing = direction === "out";
  return (
    <div className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-lg px-3 py-2 text-sm ${outgoing ? "bg-rosebrand-600 text-white" : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"}`}>
        {text}
        <div className={`mt-1 text-[10px] ${outgoing ? "text-rosebrand-100" : "text-zinc-500"}`}>enviado</div>
      </div>
    </div>
  );
}
