import { AlertCircle, Check, CheckCheck } from "lucide-react";

type MessageBubbleProps = {
  direction: "in" | "out";
  failedReason?: string | null;
  status?: "sent" | "delivered" | "failed" | "read";
  text: string;
  time?: string;
};

export function MessageBubble({ direction, failedReason, status = "read", text, time = "13:42" }: MessageBubbleProps) {
  const outgoing = direction === "out";
  const statusLabel = status === "failed" ? "falhou" : status === "read" ? "lido" : status === "delivered" ? "entregue" : "enviado";
  const StatusIcon = status === "failed" ? AlertCircle : status === "sent" ? Check : CheckCheck;

  return (
    <div className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[min(78%,42rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ring-1 ${
          outgoing
            ? "rounded-tr-md bg-gradient-to-br from-rosebrand-600 to-rosebrand-500 text-white ring-rosebrand-400/30 dark:from-rosebrand-500 dark:to-rosebrand-700 dark:ring-rosebrand-300/20"
            : "rounded-tl-md bg-white text-zinc-950 ring-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800"
        }`}
      >
        <p className="whitespace-pre-wrap break-words pr-8">{text}</p>
        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${status === "failed" ? "text-red-100 dark:text-red-100" : outgoing ? "text-white/78" : "text-zinc-500"}`}>
          <span>{time}</span>
          {outgoing && (
            <span className="inline-flex items-center gap-1" title={statusLabel}>
              <StatusIcon size={12} />
              <span className="sr-only">{statusLabel}</span>
            </span>
          )}
        </div>
        {outgoing && status === "failed" && failedReason && (
          <p className="mt-1 max-w-80 rounded-lg bg-red-950/15 px-2 py-1 text-[10px] leading-snug text-red-50">{failedReason}</p>
        )}
      </div>
    </div>
  );
}
