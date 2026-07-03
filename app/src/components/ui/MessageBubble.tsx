type MessageBubbleProps = {
  direction: "in" | "out";
  status?: "sent" | "delivered" | "read";
  text: string;
  time?: string;
};

export function MessageBubble({ direction, status = "read", text, time = "13:42" }: MessageBubbleProps) {
  const outgoing = direction === "out";
  const statusLabel = status === "read" ? "lido" : status === "delivered" ? "entregue" : "enviado";

  return (
    <div className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[72%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm ${
          outgoing
            ? "rounded-tr-sm bg-[#dcf8c6] text-zinc-950 dark:bg-emerald-900 dark:text-zinc-50"
            : "rounded-tl-sm bg-white text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
        }`}
      >
        <p className="whitespace-pre-wrap pr-10">{text}</p>
        <div className={`mt-1 flex justify-end gap-1 text-[10px] ${outgoing ? "text-emerald-800 dark:text-emerald-100" : "text-zinc-500"}`}>
          <span>{time}</span>
          {outgoing && <span>{statusLabel}</span>}
        </div>
      </div>
    </div>
  );
}
