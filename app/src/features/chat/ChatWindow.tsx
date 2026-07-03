import { Bot, CalendarClock, CheckCheck, MoreVertical, Paperclip, Phone, Send, Smile, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { AudioMessage } from "../../components/ui/AudioMessage";
import { DocumentMessage } from "../../components/ui/DocumentMessage";
import { ImageMessage } from "../../components/ui/ImageMessage";
import { MessageBubble } from "../../components/ui/MessageBubble";
import { QuickReplyBar } from "../../components/ui/QuickReplyBar";

type Message = {
  id: string;
  direction: "in" | "out";
  time: string;
  text: string;
};

const initialMessages: Message[] = [
  { id: "1", direction: "in", text: "Oi, vi o anuncio e queria entender se serve para mim.", time: "13:38" },
  { id: "2", direction: "out", text: "Claro, Marina. Para te orientar melhor, voce busca reduzir medidas em qual regiao?", time: "13:39" }
];

export function ChatWindow() {
  const [actionMessage, setActionMessage] = useState("Atendimento iniciado via Meta Leads. A agente pode responder ate o humano assumir.");
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    function handleExternalAction(event: Event) {
      const action = event instanceof CustomEvent ? String(event.detail) : "";
      if (action) runAction(action);
    }

    window.addEventListener("crm-action", handleExternalAction);
    return () => window.removeEventListener("crm-action", handleExternalAction);
  }, []);

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        direction: "out",
        time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
        text
      }
    ]);
    setDraft("");
  }

  function runAction(label: string, response?: string) {
    setActionMessage(label);
    if (response) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          direction: "out",
          time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
          text: response
        }
      ]);
    }
  }

  return (
    <section className="flex min-h-0 flex-col border-r border-rosebrand-100 bg-[#efeae2] dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex h-16 items-center justify-between border-b border-rosebrand-100 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-rosebrand-100 text-base font-semibold text-rosebrand-700">M</span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">Marina Alves</h3>
            <p className="truncate text-xs text-emerald-600">online agora - digitando...</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <button className="rounded-lg p-2 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => runAction("Ligacao iniciada para Marina Alves.")} title="Ligar" type="button"><Phone size={18} /></button>
          <button className="rounded-lg p-2 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => runAction("Atendimento transferido para especialista humana.")} title="Transferir" type="button"><UserPlus size={18} /></button>
          <button className="rounded-lg p-2 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => runAction("Retorno agendado para hoje as 17:30.")} title="Agendar retorno" type="button"><CalendarClock size={18} /></button>
          <button className="rounded-lg p-2 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => runAction("Menu de acoes: venda, perda, nota interna e historico.")} title="Mais" type="button"><MoreVertical size={18} /></button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55)_0_1px,transparent_1px)] p-5">
        <div className="mx-auto mb-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800 shadow-sm">
          {actionMessage}
        </div>
        {messages.map((message) => (
          <MessageBubble direction={message.direction} key={message.id} text={message.text} time={message.time} />
        ))}
        <AudioMessage />
        <ImageMessage />
        <DocumentMessage />
      </div>

      <QuickReplyBar
        onSelect={(reply) =>
          runAction(`Resposta rapida enviada: ${reply}`, reply === "Agendar avaliacao" ? "Posso te passar os horarios disponiveis para avaliacao ainda hoje." : reply)
        }
      />

      <footer className="flex items-end gap-2 border-t border-rosebrand-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <button className="grid size-10 place-items-center rounded-full text-zinc-500 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => setDraft((current) => `${current} 🙂`)} type="button" title="Emoji">
          <Smile size={20} />
        </button>
        <button className="grid size-10 place-items-center rounded-full text-zinc-500 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => runAction("Anexo selecionado. Upload real entra na etapa do provedor de mensagens.")} type="button" title="Anexar">
          <Paperclip size={18} />
        </button>
        <input
          className="min-h-10 min-w-0 flex-1 rounded-full border border-rosebrand-100 bg-white px-4 py-2 text-sm outline-none focus:border-rosebrand-400 dark:border-zinc-800 dark:bg-zinc-950"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          placeholder="Mensagem"
          value={draft}
        />
        <button className="grid size-10 place-items-center rounded-full bg-rosebrand-600 text-white shadow-soft" onClick={sendMessage} type="button" title="Enviar">
          <Send size={18} />
        </button>
      </footer>

      <div className="hidden">
        <Bot />
        <CheckCheck />
      </div>
    </section>
  );
}
