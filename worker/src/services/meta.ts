import type { Env } from "../env";
import { saveMessage } from "./d1";

type InboundMetaMessage = {
  body: string;
  conversationId: string;
  externalId?: string;
  leadId: string;
  mediaMimeType?: string;
  mediaUrl?: string;
  messageType: "audio" | "document" | "image" | "text" | "video";
  provider: "facebook" | "instagram" | "whatsapp";
};

type GraphConversation = {
  id?: string;
  messages?: { data?: GraphMessage[] };
  participants?: { data?: Array<{ id?: string; name?: string }> };
};

type GraphMessage = {
  attachments?: { data?: Array<{ image_data?: { url?: string }; mime_type?: string; name?: string; type?: string }> };
  created_time?: string;
  from?: { id?: string; name?: string };
  id?: string;
  message?: string;
  to?: { data?: Array<{ id?: string; name?: string }> };
};

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function getText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeAttachmentType(type: string): InboundMetaMessage["messageType"] {
  if (type === "audio") return "audio";
  if (type === "video") return "video";
  if (type === "file" || type === "document") return "document";
  if (type === "image") return "image";
  return "text";
}

function getMessengerPageId(env: Env) {
  return env.META_PAGE_ID || "1256240180895678";
}

function extractMessagingMessages(payload: unknown): InboundMetaMessage[] {
  const root = asObject(payload);
  const provider = root.object === "instagram" ? "instagram" : "facebook";
  const entries = Array.isArray(root.entry) ? root.entry : [];
  const messages: InboundMetaMessage[] = [];

  for (const entry of entries) {
    const messaging = Array.isArray(asObject(entry).messaging) ? asObject(entry).messaging as unknown[] : [];
    for (const event of messaging) {
      const item = asObject(event);
      const sender = asObject(item.sender);
      const message = asObject(item.message);
      const senderId = getText(sender.id);
      const text = getText(message.text);
      const attachments = Array.isArray(message.attachments) ? message.attachments as unknown[] : [];

      if (senderId && text) {
        messages.push({
          body: text,
          conversationId: `${provider}:${senderId}`,
          externalId: getText(message.mid),
          leadId: senderId,
          messageType: "text",
          provider
        });
      }

      for (const rawAttachment of attachments) {
        const attachment = asObject(rawAttachment);
        const type = normalizeAttachmentType(getText(attachment.type));
        const payload = asObject(attachment.payload);
        const url = getText(payload.url);

        if (senderId && type !== "text") {
          messages.push({
            body: `[${type} recebido via ${provider === "instagram" ? "Instagram" : "Facebook"}]`,
            conversationId: `${provider}:${senderId}`,
            externalId: getText(message.mid),
            leadId: senderId,
            mediaUrl: url,
            messageType: type,
            provider
          });
        }
      }
    }
  }

  return messages;
}

function extractWhatsappMessages(payload: unknown): InboundMetaMessage[] {
  const root = asObject(payload);
  const entries = Array.isArray(root.entry) ? root.entry : [];
  const messages: InboundMetaMessage[] = [];

  for (const entry of entries) {
    const changes = Array.isArray(asObject(entry).changes) ? asObject(entry).changes as unknown[] : [];
    for (const change of changes) {
      const value = asObject(asObject(change).value);
      const whatsappMessages = Array.isArray(value.messages) ? value.messages as unknown[] : [];

      for (const rawMessage of whatsappMessages) {
        const message = asObject(rawMessage);
        const from = getText(message.from);
        const type = getText(message.type);
        const textBody = getText(asObject(message.text).body);
        const media = asObject(message[type]);
        const mediaId = getText(media.id);
        const caption = getText(media.caption);
        const mimeType = getText(media.mime_type);
        const messageType = normalizeAttachmentType(type);
        const body = textBody || caption || `[${messageType || "mensagem"} recebida via WhatsApp]`;

        if (from && body) {
          messages.push({
            body,
            conversationId: `whatsapp:${from}`,
            externalId: getText(message.id),
            leadId: from,
            mediaMimeType: mimeType,
            mediaUrl: mediaId ? `meta-media:${mediaId}` : undefined,
            messageType,
            provider: "whatsapp"
          });
        }
      }
    }
  }

  return messages;
}

async function persistInboundMessages(messages: InboundMetaMessage[], env: Env) {
  const saved = [];

  for (const message of messages) {
    saved.push(
      await saveMessage(env.DB, {
        body: message.body,
        conversationId: message.conversationId,
        direction: "inbound",
        externalMessageId: message.externalId,
        leadId: message.leadId,
        mediaMimeType: message.mediaMimeType,
        mediaUrl: message.mediaUrl,
        messageType: message.messageType,
        organizationId: "beleza-manaus",
        senderType: message.provider
      })
    );
  }

  return saved;
}

export async function createLeadFromMetaEvent(payload: unknown, env: Env) {
  const messages = [...extractMessagingMessages(payload), ...extractWhatsappMessages(payload)];
  const savedMessages = await persistInboundMessages(messages, env);

  return {
    action: savedMessages.length > 0 ? "messages_received" : "lead_received",
    mode: savedMessages.length > 0 ? "d1_messages" : "lead_placeholder",
    payload,
    savedMessages
  };
}

function getChannelRecipient(conversationId: string) {
  const separatorIndex = conversationId.indexOf(":");
  if (separatorIndex < 0) return { channel: "crm", recipientId: conversationId };

  return {
    channel: conversationId.slice(0, separatorIndex),
    recipientId: conversationId.slice(separatorIndex + 1)
  };
}

async function sendFacebookOrInstagramMessage(env: Env, recipientId: string, text: string) {
  const response = await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${encodeURIComponent(env.META_PAGE_ACCESS_TOKEN)}`, {
    body: JSON.stringify({
      messaging_type: "RESPONSE",
      message: { text },
      recipient: { id: recipientId }
    }),
    headers: { "content-type": "application/json" },
    method: "POST"
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data as { message_id?: string; recipient_id?: string };
}

async function sendWhatsappMessage(env: Env, recipientId: string, text: string) {
  const accessToken = env.WHATSAPP_ACCESS_TOKEN || env.META_PAGE_ACCESS_TOKEN;

  if (!env.META_PHONE_NUMBER_ID || !accessToken) {
    throw new Error("WhatsApp ainda nao esta configurado. Informe META_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN depois de conectar o numero.");
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${env.META_PHONE_NUMBER_ID}/messages`, {
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientId,
      type: "text",
      text: { body: text, preview_url: false }
    }),
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    method: "POST"
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  const messages = Array.isArray((data as { messages?: unknown[] }).messages) ? (data as { messages?: Array<{ id?: string }> }).messages : [];
  return { message_id: messages?.[0]?.id };
}

export async function sendOutboundChannelMessage(env: Env, input: { conversationId: string; text: string }) {
  const { channel, recipientId } = getChannelRecipient(input.conversationId);

  if (channel === "facebook" || channel === "instagram") {
    const data = await sendFacebookOrInstagramMessage(env, recipientId, input.text);
    return { channel, externalMessageId: data.message_id, ok: true };
  }

  if (channel === "whatsapp") {
    const data = await sendWhatsappMessage(env, recipientId, input.text);
    return { channel, externalMessageId: data.message_id, ok: true };
  }

  return { channel, externalMessageId: undefined, ok: true };
}

function getOtherParticipantId(conversation: GraphConversation, pageId: string) {
  const participants = conversation.participants?.data ?? [];
  const otherParticipant = participants.find((participant) => participant.id && participant.id !== pageId);
  return otherParticipant?.id ?? "";
}

function getGraphMessageType(message: GraphMessage): InboundMetaMessage["messageType"] {
  const attachment = message.attachments?.data?.[0];
  return normalizeAttachmentType(getText(attachment?.type));
}

function getGraphMessageBody(message: GraphMessage, messageType: InboundMetaMessage["messageType"]) {
  if (message.message) return message.message;
  if (messageType === "image") return "[imagem recebida via Facebook]";
  if (messageType === "video") return "[video recebido via Facebook]";
  if (messageType === "audio") return "[audio recebido via Facebook]";
  if (messageType === "document") return "[documento recebido via Facebook]";
  return "[mensagem recebida via Facebook]";
}

export async function syncMessengerInbox(env: Env) {
  const pageId = getMessengerPageId(env);
  const fields = "id,updated_time,participants.limit(10){id,name},messages.limit(20){id,message,from,to,created_time,attachments{mime_type,name,type,image_data}}";
  const response = await fetch(
    `https://graph.facebook.com/v20.0/${pageId}/conversations?fields=${encodeURIComponent(fields)}&limit=25&access_token=${encodeURIComponent(env.META_PAGE_ACCESS_TOKEN)}`
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  const conversations = Array.isArray((data as { data?: unknown[] }).data) ? ((data as { data?: GraphConversation[] }).data ?? []) : [];
  const saved = [];

  for (const conversation of conversations) {
    const otherParticipantId = getOtherParticipantId(conversation, pageId);
    const messages = conversation.messages?.data ?? [];

    for (const graphMessage of messages.reverse()) {
      const fromId = graphMessage.from?.id ?? "";
      const recipientId = graphMessage.to?.data?.find((recipient) => recipient.id !== fromId)?.id ?? "";
      const leadId = fromId === pageId ? otherParticipantId || recipientId : fromId || otherParticipantId;

      if (!leadId || !graphMessage.id) continue;

      const messageType = getGraphMessageType(graphMessage);
      const attachment = graphMessage.attachments?.data?.[0];

      saved.push(
        await saveMessage(env.DB, {
          body: getGraphMessageBody(graphMessage, messageType),
          conversationId: `facebook:${leadId}`,
          direction: fromId === pageId ? "outbound" : "inbound",
          externalMessageId: graphMessage.id,
          leadId,
          mediaMimeType: attachment?.mime_type,
          mediaUrl: attachment?.image_data?.url,
          messageType,
          organizationId: "beleza-manaus",
          senderType: "facebook",
          status: "sent"
        })
      );
    }
  }

  return {
    conversations: conversations.length,
    imported: saved.filter((message) => !("deduped" in message)).length,
    pageId,
    saved: saved.length
  };
}

export async function getAdsInsights(_env: Env) {
  return {
    mode: "placeholder",
    campaigns: []
  };
}

export async function sendConversionEvent(payload: unknown, _env: Env, options: { dryRun: boolean }) {
  return {
    dryRun: options.dryRun,
    event: payload,
    sent: !options.dryRun
  };
}
