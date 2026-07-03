import { Paperclip, Send } from "lucide-react";
import { useState } from "react";
import { AudioMessage } from "../../components/ui/AudioMessage";
import { DocumentMessage } from "../../components/ui/DocumentMessage";
import { ImageMessage } from "../../components/ui/ImageMessage";
import { MessageBubble } from "../../components/ui/MessageBubble";
import { QuickReplyBar } from "../../components/ui/QuickReplyBar";

type Message = {
  id: string;
  direction: "in" | "out";
  text: string;
};

const initialMessages: Message[] = [
  { id: "1", direction: "in", text: "Oi, vi o anuncio e queria entender se serve para mim." },
  { id: "2", direction: "out", text: "Claro, Marina. Para te orientar melhor, voce busca reduzir medidas em qual regiao?" }
];

export function ChatWindow() {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        direction: "out",
        text
      }
    ]);
    setDraft("");
  }

  return (
    <section className="flex min-h-[520px] flex-col rounded-lg border border-rosebrand-100 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <header className="border-b border-rosebrand-100 p-4 dark:border-zinc-800">
        <h3 className="font-semibold">Marina Alves</h3>
        <p className="text-xs text-emerald-600">digitando...</p>
      </header>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <MessageBubble direction={message.direction} key={message.id} text={message.text} />
        ))}
        <AudioMessage />
        <ImageMessage />
        <DocumentMessage />
      </div>
      <QuickReplyBar />
      <footer className="flex gap-2 border-t border-rosebrand-100 p-3 dark:border-zinc-800">
        <button className="rounded-lg border border-rosebrand-100 p-2 dark:border-zinc-800" type="button" title="Anexar">
          <Paperclip size={18} />
        </button>
        <input
          className="min-w-0 flex-1 rounded-lg border border-rosebrand-100 bg-white px-3 py-2 text-sm outline-none focus:border-rosebrand-400 dark:border-zinc-800 dark:bg-zinc-950"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          placeholder="Mensagem"
          value={draft}
        />
        <button className="rounded-lg bg-rosebrand-600 p-2 text-white" onClick={sendMessage} type="button" title="Enviar">
          <Send size={18} />
        </button>
      </footer>
    </section>
  );
}
