import { AlertTriangle, Bot, CalendarClock, CheckCheck, Facebook, FileText, Image as ImageIcon, Instagram, Mic, MoreVertical, Paperclip, Phone, Play, Send, Smile, Sparkles, Square, UserPlus, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageBubble } from "../../components/ui/MessageBubble";
import { QuickReplyBar } from "../../components/ui/QuickReplyBar";
import { formatManausTime } from "../../lib/time";
import { apiFetch } from "../../services/api";

type Message = {
  id: string;
  direction: "in" | "out";
  failedReason?: string | null;
  mediaMimeType?: string | null;
  mediaUrl?: string | null;
  messageType?: string;
  status?: "delivered" | "failed" | "read" | "sent";
  time: string;
  text: string;
};

type D1Message = {
  id: string;
  body: string | null;
  created_at: string;
  direction: "inbound" | "outbound";
  failed_reason?: string | null;
  media_mime_type: string | null;
  media_url: string | null;
  message_type: string;
  providerError?: string;
  status?: string;
};

type MessagesResponse = {
  messages: D1Message[];
  nextCursor: { beforeCreatedAt: string; beforeId: string } | null;
};

type OutboundMediaPayload = {
  body: string;
  mediaMimeType?: string;
  mediaSize?: number;
  mediaUrl?: string;
  messageType: "audio" | "document" | "image" | "video";
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
  return formatManausTime(value);
}

function toUiMessage(message: D1Message): Message {
  return {
    id: message.id,
    direction: message.direction === "outbound" ? "out" : "in",
    failedReason: message.failed_reason,
    mediaMimeType: message.media_mime_type,
    mediaUrl: message.media_url,
    messageType: message.message_type,
    status: message.status === "failed" ? "failed" : message.status === "delivered" ? "delivered" : message.status === "read" ? "read" : "sent",
    text: message.body ?? "",
    time: formatMessageTime(message.created_at)
  };
}

function providerErrorMessage(providerError?: string) {
  if (!providerError) return "";

  try {
    const data = JSON.parse(providerError) as { error?: { message?: string; code?: number; error_subcode?: number } };
    const message = data.error?.message;
    if (message) {
      const code = data.error?.code ? ` codigo ${data.error.code}` : "";
      const subcode = data.error?.error_subcode ? `/${data.error.error_subcode}` : "";
      return `${message}${code}${subcode}`;
    }
  } catch {
    // The worker can also return a plain configuration error.
  }

  return providerError;
}

function fileMessageType(file: File): OutboundMediaPayload["messageType"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}

function readableFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function MediaMessage({ message }: { message: Message }) {
  const outgoing = message.direction === "out";
  const shellClass = `max-w-[min(78%,28rem)] rounded-2xl p-1.5 shadow-sm ring-1 ${
    outgoing
      ? "ml-auto rounded-tr-md bg-gradient-to-br from-rosebrand-600 to-rosebrand-500 text-white ring-rosebrand-400/30"
      : "mr-auto rounded-tl-md bg-white text-zinc-950 ring-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800"
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

  return <MessageBubble direction={message.direction} failedReason={message.failedReason} status={message.status} text={message.text} time={message.time} />;
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
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [nextCursor, setNextCursor] = useState<MessagesResponse["nextCursor"]>(null);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const conversationIdRef = useRef(conversationId);
  const loadRequestRef = useRef(0);
  const pendingMessagesRef = useRef<Message[]>([]);
  const shouldScrollBottomRef = useRef(true);

  useEffect(() => {
    conversationIdRef.current = conversationId;
    loadRequestRef.current += 1;
    pendingMessagesRef.current = [];
    shouldScrollBottomRef.current = true;
    setMessages([]);
    setNextCursor(null);
    setLoadingMessages(true);
    setActionMessage(`Atendimento iniciado via ${channelName}.`);
  }, [channelName, conversationId]);

  const loadMessages = useCallback(async (showLoading = false) => {
    const requestId = ++loadRequestRef.current;
    const targetConversationId = conversationId;
    if (showLoading) setLoadingMessages(true);

    const data = await apiFetch<MessagesResponse>(`/chat?conversationId=${targetConversationId}&limit=50`);
    if (requestId !== loadRequestRef.current || targetConversationId !== conversationIdRef.current) return;

    const loaded = data.messages.filter((message) => message.body).map(toUiMessage);
    const pending = pendingMessagesRef.current.filter((message) => !loaded.some((loadedMessage) => loadedMessage.id === message.id));
    shouldScrollBottomRef.current = true;
    setMessages([...loaded, ...pending]);
    setNextCursor(data.nextCursor);
  }, [conversationId]);

  const loadOlderMessages = useCallback(async () => {
    if (!nextCursor || loadingOlder) return;
    const targetConversationId = conversationId;
    const scrollElement = scrollRef.current;
    const previousHeight = scrollElement?.scrollHeight ?? 0;
    setLoadingOlder(true);

    try {
      const params = new URLSearchParams({
        beforeCreatedAt: nextCursor.beforeCreatedAt,
        beforeId: nextCursor.beforeId,
        conversationId: targetConversationId,
        limit: "50"
      });
      const data = await apiFetch<MessagesResponse>(`/chat?${params.toString()}`);
      if (targetConversationId !== conversationIdRef.current) return;
      const older = data.messages.filter((message) => message.body).map(toUiMessage);
      shouldScrollBottomRef.current = false;
      setMessages((current) => {
        const seen = new Set(current.map((message) => message.id));
        return [...older.filter((message) => !seen.has(message.id)), ...current];
      });
      setNextCursor(data.nextCursor);
      window.requestAnimationFrame(() => {
        if (!scrollElement) return;
        scrollElement.scrollTop = scrollElement.scrollHeight - previousHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, loadingOlder, nextCursor]);

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
    if (shouldScrollBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  function handleScroll() {
    if (scrollRef.current?.scrollTop === 0) {
      loadOlderMessages().catch(() => undefined);
    }
  }

  async function persistMessage(
    text: string,
    direction: "inbound" | "outbound",
    senderType: "agent" | "human" | "lead",
    media?: Partial<OutboundMediaPayload>
  ) {
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
        mediaMimeType: media?.mediaMimeType,
        mediaSize: media?.mediaSize,
        mediaUrl: media?.mediaUrl,
        messageType: media?.messageType ?? "text",
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
    shouldScrollBottomRef.current = true;
    setMessages((current) => [...current, optimisticMessage]);
    setDraft("");

    try {
      const result = await persistMessage(text, "outbound", "human");
      const savedMessage = toUiMessage(result);
      pendingMessagesRef.current = pendingMessagesRef.current.filter((message) => message.id !== optimisticMessage.id);
      setMessages((current) => current.map((message) => message.id === optimisticMessage.id ? savedMessage : message));
      setActionMessage(
        result.providerError
          ? `Mensagem registrada, mas a Meta recusou o envio: ${providerErrorMessage(result.providerError)}`
          : `Mensagem enviada pelo ${channelName} e registrada no D1.`
      );
    } catch {
      pendingMessagesRef.current = pendingMessagesRef.current.filter((message) => message.id !== optimisticMessage.id);
      setActionMessage(`Nao foi possivel enviar pelo ${channelName}. Verifique token, permissao ou janela de atendimento.`);
    } finally {
      setSending(false);
    }
  }

  async function sendMediaPayload(payload: OutboundMediaPayload) {
    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      direction: "out",
      mediaMimeType: payload.mediaMimeType,
      mediaUrl: payload.mediaUrl,
      messageType: payload.messageType,
      status: "sent",
      text: payload.body,
      time: formatMessageTime()
    };

    pendingMessagesRef.current = [...pendingMessagesRef.current, optimisticMessage];
    shouldScrollBottomRef.current = true;
    setMessages((current) => [...current, optimisticMessage]);
    setUploadingFiles((current) => current + 1);
    setActionMessage(`Enviando ${payload.messageType === "document" ? "arquivo" : payload.messageType} pelo ${channelName}...`);

    try {
      const result = await persistMessage(payload.body, "outbound", "human", payload);
      const savedMessage = toUiMessage(result);
      pendingMessagesRef.current = pendingMessagesRef.current.filter((message) => message.id !== optimisticMessage.id);
      setMessages((current) => current.map((message) => message.id === optimisticMessage.id ? { ...savedMessage, mediaUrl: payload.mediaUrl ?? savedMessage.mediaUrl } : message));
      setActionMessage(
        result.providerError
          ? `Arquivo registrado, mas a Meta recusou o envio: ${providerErrorMessage(result.providerError)}`
          : `Arquivo registrado no atendimento. O campo de texto continua liberado para novas mensagens.`
      );
    } catch {
      pendingMessagesRef.current = pendingMessagesRef.current.filter((message) => message.id !== optimisticMessage.id);
      setMessages((current) => current.map((message) => message.id === optimisticMessage.id ? { ...message, failedReason: "Nao foi possivel registrar este arquivo.", status: "failed" } : message));
      setActionMessage("Nao foi possivel registrar o arquivo agora.");
    } finally {
      setUploadingFiles((current) => Math.max(0, current - 1));
    }
  }

  function handleFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) return;
    for (const file of selectedFiles) {
      const messageType = fileMessageType(file);
      const mediaUrl = URL.createObjectURL(file);
      sendMediaPayload({
        body: `${file.name} (${readableFileSize(file.size)})`,
        mediaMimeType: file.type || "application/octet-stream",
        mediaSize: file.size,
        mediaUrl,
        messageType
      }).catch(() => undefined);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function startRecording() {
    if (recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        if (blob.size > 0) {
          const fileName = `audio-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
          sendMediaPayload({
            body: `${fileName} (${readableFileSize(blob.size)})`,
            mediaMimeType: blob.type,
            mediaSize: blob.size,
            mediaUrl: URL.createObjectURL(blob),
            messageType: "audio"
          }).catch(() => undefined);
        }
      };
      recorder.start();
      setRecording(true);
      setActionMessage("Gravando audio. O campo de texto continua liberado.");
    } catch {
      setActionMessage("Nao consegui acessar o microfone. Verifique a permissao do navegador.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
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
    <section className="flex min-h-0 flex-col border-r border-rosebrand-100 bg-[#fff8fb] dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex h-16 items-center justify-between border-b border-rosebrand-100 bg-white/95 px-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="flex min-w-0 items-center gap-3">
          <ContactAvatar contact={contact} conversationId={conversationId} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{contact.name || fallbackContactName(conversationId)}</h3>
            <p className="truncate text-xs font-medium text-emerald-600">
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

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,241,247,0.72),rgba(255,255,255,0.82)),radial-gradient(circle_at_20%_20%,rgba(236,47,134,0.10)_0_1px,transparent_1px)] bg-[length:auto,22px_22px] p-5 dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.94),rgba(9,9,11,0.98)),radial-gradient(circle_at_20%_20%,rgba(236,47,134,0.14)_0_1px,transparent_1px)]" onScroll={handleScroll} ref={scrollRef}>
        <div className={`mx-auto mb-3 inline-flex max-w-xl items-center gap-2 rounded-full px-3 py-2 text-center text-xs shadow-sm ring-1 ${
          actionMessage.includes("recusou") || actionMessage.includes("Nao foi possivel")
            ? "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/40 dark:text-red-100 dark:ring-red-900"
            : "bg-white/90 text-zinc-600 ring-rosebrand-100 dark:bg-zinc-900/90 dark:text-zinc-300 dark:ring-zinc-800"
        }`}>
          {actionMessage.includes("recusou") || actionMessage.includes("Nao foi possivel") ? <AlertTriangle size={14} /> : <Sparkles size={14} />}
          <span>{loadingMessages ? `Carregando mensagens do ${channelName}...` : uploadingFiles > 0 ? `${uploadingFiles} arquivo(s) em envio. Voce pode continuar digitando.` : actionMessage}</span>
        </div>
        {loadingOlder && (
          <div className="mx-auto rounded-lg bg-white px-3 py-1 text-xs text-zinc-500 shadow-sm dark:bg-zinc-900">
            Carregando historico...
          </div>
        )}
        {!loadingMessages && messages.length === 0 && (
          <div className="mx-auto mt-16 max-w-sm rounded-2xl bg-white/95 px-5 py-4 text-center text-sm text-zinc-500 shadow-soft ring-1 ring-rosebrand-100 dark:bg-zinc-900/95 dark:ring-zinc-800">
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

      <footer className="flex items-end gap-2 border-t border-rosebrand-100 bg-white/95 p-3 shadow-[0_-12px_34px_rgba(146,19,75,0.06)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <button className="grid size-10 place-items-center rounded-full text-zinc-500 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => setDraft((current) => `${current} 🙂`)} type="button" title="Emoji">
          <Smile size={20} />
        </button>
        <input
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          className="hidden"
          multiple
          onChange={(event) => handleFiles(event.target.files)}
          ref={fileInputRef}
          type="file"
        />
        <button className="grid size-10 place-items-center rounded-full text-zinc-500 hover:bg-rosebrand-50 dark:hover:bg-zinc-800" onClick={() => fileInputRef.current?.click()} type="button" title="Anexar foto, video ou arquivo">
          <Paperclip size={18} />
        </button>
        <button className={`grid size-10 place-items-center rounded-full ${recording ? "bg-red-600 text-white" : "text-zinc-500 hover:bg-rosebrand-50 dark:hover:bg-zinc-800"}`} onClick={recording ? stopRecording : startRecording} type="button" title={recording ? "Parar gravacao" : "Gravar audio"}>
          {recording ? <Square size={16} /> : <Mic size={18} />}
        </button>
        <input
          className="min-h-11 min-w-0 flex-1 rounded-full border border-rosebrand-100 bg-rosebrand-50/40 px-4 py-2 text-sm outline-none transition focus:border-rosebrand-400 focus:bg-white focus:ring-4 focus:ring-rosebrand-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-rosebrand-900/30"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          placeholder="Mensagem"
          value={draft}
        />
        <button className="grid size-11 place-items-center rounded-full bg-rosebrand-600 text-white shadow-soft transition hover:bg-rosebrand-700 disabled:opacity-60" disabled={sending || !draft.trim()} onClick={sendMessage} type="button" title="Enviar mensagem de texto">
          <Send size={18} />
        </button>
      </footer>

      <div className="hidden">
        <CheckCheck />
      </div>
    </section>
  );
}
