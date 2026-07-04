import { Bot, CalendarClock, CheckCheck, Facebook, FileText, Image as ImageIcon, Instagram, MoreVertical, Paperclip, Phone, Play, Send, Smile, UserPlus, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageBubble } from "../../components/ui/MessageBubble";
import { QuickReplyBar } from "../../components/ui/QuickReplyBar";
import { apiFetch } from "../../services/api";

type Message = {
  id: string;
  direction: "in" | "out";
  mediaMimeType?: string | null;
  mediaUrl?: string | null;
  messageType?: string;
  time: string;
  text: string;
};

type D1Message = {
  id: string;
  body: string | null;
  created_at: string;
  direction: "inbound" | "outbound";
  media_mime_type: string | null;
  media_url: string | null;
  message_type: string;
  providerError?: string;
  status?: string;
};

type ChatContact = {
  avatarUrl?: string | null;
  channel?: string | null;
  isTyping?: number | null;
  name?: string | null;
  phone?: string | null;
  presenceStatus?: string | null;
};

const organizationId = "beleza-manaus";

function channelFromConversation(conversationId: string, contact: ChatContact) {
  if (contact.channel === "facebook" || contact.channel === "instagram" || contact.channel === "whatsapp") return contact.channel;
  if (conversationId.startsWith("facebook:")) return "facebook";
  if (conversationId.startsWith("instagram:")) return "instagram";
  if (conversationId.startsWith("whatsapp:")) return "whatsapp";
  return "crm";
}

function channelLabel(channel: string) {
  if (channel === "facebook") return "Facebook";
  if (channel === "instagram") return "Instagram";
  if (channel === "whatsapp") return "WhatsApp";
  return "CRM";
}

function formatMessageTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  }

  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function toUiMessage(message: D1Message): Message {
  return {
    id: message.id,
    direction: message.direction === "outbound" ? "out" : "in",
    mediaMimeType: message.media_mime_type,
    mediaUrl: message.media_url,
    messageType: message.message_type,
    text: message.body ?? "",
    time: formatMessageTime(message.created_at)
  };
}

function MediaMessage({ message }: { message: Message }) {
  const outgoing = message.direction === "out";
  const shellClass = `max-w-[78%] rounded-lg p-1 shadow-sm ${
    outgoing
      ? "ml-auto rounded-tr-sm bg-[#dcf8c6] text-zinc-950 dark:bg-emerald-900 dark:text-zinc-50"
      : "mr-auto rounded-tl-sm bg-white text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
  }`;
  const isMetaMedia = message.mediaUrl?.startsWith("meta-media:");

  if (message.messageType === "image") {
    return (
      <div className={shellClass}>
        {message.mediaUrl && !isMetaMedia ? (
          <img alt={message.text || "Imagem recebida"} className="max-h-80 rounded-md object-cover" src={message.mediaUrl} />
        ) : (
          <div className="grid aspect-[4/3] w-64 place-items-center rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-900">
            <ImageIcon size={28} />
          </div>
        )}
        {message.text && <p className="px-2 pt-2 text-sm">{message.text}</p>}
        {isMetaMedia && <p className="px-2 pt-1 text-xs text-zinc-500">Midia Meta recebida. A URL sera carregada com o token permanente do canal.</p>}
        <p className="px-2 py-1 text-right text-[10px] text-zinc-500">{message.time}</p>
      </div>
    );
  }

  if (message.messageType === "video") {
    return (
      <div className={shellClass}>
        {message.mediaUrl && !isMetaMedia ? (
          <video className="max-h-80 rounded-md" controls src={message.mediaUrl} />
        ) : (
          <div className="grid aspect-video w-72 place-items-center rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-900">
            <Video size={30} />
          </div>
        )}
        {message.text && <p className="px-2 pt-2 text-sm">{message.text}</p>}
        {isMetaMedia && <p className="px-2 pt-1 text-xs text-zinc-500">Video registrado pela Meta. Download entra quando o canal estiver com token permanente.</p>}
        <p className="px-2 py-1 text-right text-[10px] text-zinc-500">{message.time}</p>
      </div>
    );
  }

  if (message.messageType === "audio") {
    return (
      <div className={`flex max-w-[78%] items-center gap-3 rounded-lg px-3 py-2 text-sm shadow-sm ${outgoing ? "ml-auto rounded-tr-sm bg-[#dcf8c6] dark:bg-emerald-900" : "mr-auto rounded-tl-sm bg-white dark:bg-zinc-800"}`}>
        <button className="grid size-9 place-items-center rounded-full bg-rosebrand-600 text-white" title="Reproduzir audio" type="button">
          <Play size={16} />
        </button>
        <div className="min-w-44 flex-1">
          <div className="h-1.5 rounded-full bg-rosebrand-100 dark:bg-zinc-700">
            <div className="h-1.5 w-2/5 rounded-full bg-rosebrand-500" />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{message.text || "Audio recebido"} · {message.time}</p>
        </div>
      </div>
    );
  }

  if (message.messageType === "document") {
    return (
      <div className={`flex max-w-[78%] items-center gap-3 rounded-lg px-3 py-2 text-sm shadow-sm ${outgoing ? "ml-auto rounded-tr-sm bg-[#dcf8c6] dark:bg-emerald-900" : "mr-auto rounded-tl-sm bg-white dark:bg-zinc-800"}`}>
        <span className="grid size-10 place-items-center rounded-lg bg-rosebrand-50 text-rosebrand-700 dark:bg-zinc-900">
          <FileText size={19} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{message.text || "Documento recebido"}</p>
          <p className="text-xs text-zinc-500">{message.mediaMimeType || "arquivo"} · {message.time}</p>
        </div>
      </div>
    );
  }

  return <MessageBubble direction={message.direction} text={message.text} time={message.time} />;
}

type ChatWindowProps = {
  contact: ChatContact;
  conversationId: string;
  leadId: string;
};

function fallbackContactName(conversationId: string) {
  const [channel, identifier] = conversationId.includes(":") ? conversationId.split(":") : ["chat", conversationId];
  if (channel === "facebook") return `Facebook ${identifier}`;
  if (channel === "instagram") return `Instagram ${identifier}`;
  if (channel === "whatsapp") return `WhatsApp ${identifier}`;
  return identifier.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ContactAvatar({ contact, conversationId }: { contact: ChatContact; conversationId: string }) {
  const name = contact.name || fallbackContactName(conversationId);
  if (contact.avatarUrl) {
    return <img alt={name} className="size-11 rounded-full object-cover" src={contact.avatarUrl} />;
  }

  if (contact.channel === "instagram" || conversationId.startsWith("instagram:")) {
    return <span className="grid size-11 place-items-center rounded-full bg-rosebrand-100 text-rosebrand-700"><Instagram size={19} /></span>;
  }

  if (contact.channel === "facebook" || conversationId.startsWith("facebook:")) {
    return <span className="grid size-11 place-items-center rounded-full bg-rosebrand-100 text-rosebrand-700"><Facebook size={19} /></span>;
  }

  return <span className="grid size-11 place-items-center rounded-full bg-rosebrand-100 text-base font-semibold text-rosebrand-700">{name[0]}</span>;
}

export function ChatWindow({ contact, conversationId, leadId }: ChatWindowProps) {
  const channel = channelFromConversation(conversationId, contact);
  const channelName = channelLabel(channel);
  const [actionMessage, setActionMessage] = useState(`Atendimento iniciado via ${channelName}.`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const conversationIdRef = useRef(conversationId);
  const loadRequestRef = useRef(0);
  const pendingMessagesRef = useRef<Message[]>([]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
    loadRequestRef.current += 1;
    pendingMessagesRef.current = [];
    setMessages([]);
    setLoadingMessages(true);
    setActionMessage(`Atendimento iniciado via ${channelName}.`);
  }, [channelName, conversationId]);

  const loadMessages = useCallback(async (showLoading = false) => {
    const requestId = ++loadRequestRef.current;
    const targetConversationId = conversationId;
    if (showLoading) setLoadingMessages(true);

    const data = await apiFetch<{ messages: D1Message[] }>(`/chat?conversationId=${targetConversationId}`);
    if (requestId !== loadRequestRef.current || targetConversationId !== conversationIdRef.current) return;

    const loaded = data.messages.filter((message) => message.body).map(toUiMessage);
    const pending = pendingMessagesRef.current.filter((message) => !loaded.some((loadedMessage) => loadedMessage.id === message.id));
    setMessages([...loaded, ...pending]);
  }, [conversationId]);

  useEffect(() => {
    function handleExternalAction(event: Event) {
      const action = event instanceof CustomEvent ? String(event.detail) : "";
      if (action) runAction(action);
    }

    window.addEventListener("crm-action", handleExternalAction);
    return () => window.removeEventListener("crm-action", handleExternalAction);
  }, []);

  useEffect(() => {
    let active = true;

    loadMessages(true)
      .catch(() => setActionMessage("D1 ainda nao respondeu. Mantendo conversa local ate o worker estar publicado."))
      .finally(() => {
        if (active) setLoadingMessages(false);
      });

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadMessages(false).catch(() => undefined);
      }
    }, 2000);

    function handleFocus() {
      loadMessages(false).catch(() => undefined);
    }

    window.addEventListener("focus", handleFocus);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [conversationId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function persistMessage(text: string, direction: "inbound" | "outbound", senderType: "agent" | "human" | "lead") {
    return apiFetch<D1Message>("/chat", {
      body: JSON.stringify({
        body: text,
        conversationMeta: {
          avatarUrl: contact.avatarUrl,
          channel,
          contactName: contact.name,
          contactPhone: contact.phone,
          isTyping: false,
          presenceStatus: contact.presenceStatus ?? "online"
        },
        conversationId,
        direction,
        leadId,
      messageType: "text",
        organizationId,
        senderType
      }),
      method: "POST"
    });
  }

  async function askAgent(text: string) {
    const data = await apiFetch<{ reply: string }>("/agent", {
      body: JSON.stringify({ leadId, message: text, organizationId }),
      method: "POST"
    });

    return data.reply;
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text) return;

    const optimisticMessage = {
      id: crypto.randomUUID(),
      direction: "out" as const,
      time: formatMessageTime(),
      text
    };

    setSending(true);
    setActionMessage(`Enviando mensagem pelo ${channelName}...`);
    pendingMessagesRef.current = [...pendingMessagesRef.current, optimisticMessage];
    setMessages((current) => [...current, optimisticMessage]);
    setDraft("");

    try {
      const result = await persistMessage(text, "outbound", "human");
      const savedMessage = toUiMessage(result);
      pendingMessagesRef.current = pendingMessagesRef.current.filter((message) => message.id !== optimisticMessage.id);
      setMessages((current) => current.map((message) => message.id === optimisticMessage.id ? savedMessage : message));
      setActionMessage(
        result.providerError
          ? "Mensagem registrada, mas a Meta recusou o envio. Verifique janela de atendimento, token ou permissoes."
          : `Mensagem enviada pelo ${channelName} e registrada no D1.`
      );
    } catch {
      pendingMessagesRef.current = pendingMessagesRef.current.filter((message) => message.id !== optimisticMessage.id);
      setActionMessage(`Nao foi possivel enviar pelo ${channelName}. Verifique token, permissao ou janela de atendimento.`);
    } finally {
      setSending(false);
    }
  }

  async function runAction(label: string, response?: string) {
    setActionMessage(label);
    if (response) {
      const nextMessage = {
        id: crypto.randomUUID(),
        direction: "out" as const,
        time: formatMessageTime(),
        text: response
      };
      setMessages((current) => [
        ...current,
        nextMessage
      ]);

      try {
        await persistMessage(response, "outbound", "agent");
      } catch {
        setActionMessage("Resposta exibida, mas o D1 ainda nao confirmou a gravacao.");
      }
    }
  }

  async function requestAgentDraft() {
    const lastLeadMessage = [...messages].reverse().find((message) => message.direction === "in")?.text ?? draft;
    setActionMessage("Agente preparando resposta...");

    try {
      const reply = await askAgent(lastLeadMessage);
      await runAction("Agente sugeriu e enviou uma resposta assistida.", reply);
    } catch {
      setActionMessage("Nao consegui acionar a agente agora. Verifique o worker/API_URL.");
    }
  }

  return (
    <section className="flex min-h-0 flex-col border-r border-rosebrand-100 bg-[#efeae2] dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex h-16 items-center justify-between border-b border-rosebrand-100 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex min-w-0 items-center gap-3">
          <ContactAvatar contact={contact} conversationId={conversationId} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{contact.name || fallbackContactName(conversationId)}</h3>
            <p className="truncate text-xs text-emerald-600">
              {contact.isTyping ? "digitando..." : contact.presenceStatus === "online" ? "online agora" : "ultimo contato recente"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <button className="rounded-lg p-2 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => runAction("Ligacao iniciada para Marina Alves.")} title="Ligar" type="button"><Phone size={18} /></button>
          <button className="rounded-lg p-2 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => runAction("Atendimento transferido para especialista humana.")} title="Transferir" type="button"><UserPlus size={18} /></button>
          <button className="rounded-lg p-2 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => runAction("Retorno agendado para hoje as 17:30.")} title="Agendar retorno" type="button"><CalendarClock size={18} /></button>
          <button className="rounded-lg p-2 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={requestAgentDraft} title="Acionar agente" type="button"><Bot size={18} /></button>
          <button className="rounded-lg p-2 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => runAction("Menu de acoes: venda, perda, nota interna e historico.")} title="Mais" type="button"><MoreVertical size={18} /></button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55)_0_1px,transparent_1px)] p-5">
        <div className="mx-auto mb-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800 shadow-sm">
          {loadingMessages ? `Carregando mensagens do ${channelName}...` : actionMessage}
        </div>
        {!loadingMessages && messages.length === 0 && (
          <div className="mx-auto mt-16 max-w-sm rounded-lg bg-white px-4 py-3 text-center text-sm text-zinc-500 shadow-sm dark:bg-zinc-900">
            Nenhuma mensagem nessa conversa ainda. Quando o cliente responder pelo {channelName}, texto, foto, video ou audio aparecem aqui.
          </div>
        )}
        {messages.map((message) => <MediaMessage key={message.id} message={message} />)}
        <div ref={bottomRef} />
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
        <button className="grid size-10 place-items-center rounded-full bg-rosebrand-600 text-white shadow-soft disabled:opacity-60" disabled={sending} onClick={sendMessage} type="button" title="Enviar">
          <Send size={18} />
        </button>
      </footer>

      <div className="hidden">
        <CheckCheck />
      </div>
    </section>
  );
}
