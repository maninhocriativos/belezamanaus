import type { Env } from "../env";
import type { NormalizedMessage } from "../types/chat";
import { asObject, getText, normalizeAttachmentType, type MessageAdapter, type SendTextInput } from "./message-adapter";

export function normalizeWhatsappCloudPayload(payload: unknown): NormalizedMessage[] {
  const root = asObject(payload);
  const entries = Array.isArray(root.entry) ? root.entry : [];
  const messages: NormalizedMessage[] = [];

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
            channel: "whatsapp",
            direction: "inbound",
            externalConversationId: from,
            externalMessageId: getText(message.id),
            mediaId,
            mediaUrl: mediaId ? `meta-media:${mediaId}` : undefined,
            messageType,
            mimeType,
            rawPayload: rawMessage,
            senderId: from
          });
        }
      }
    }
  }

  return messages;
}

export async function sendWhatsappCloudText(env: Env, input: SendTextInput) {
  const accessToken = env.WHATSAPP_ACCESS_TOKEN || env.META_PAGE_ACCESS_TOKEN;

  if (!env.META_PHONE_NUMBER_ID || !accessToken) {
    throw new Error("WhatsApp Cloud API nao esta configurado.");
  }
  const response = await fetch(`https://graph.facebook.com/v20.0/${env.META_PHONE_NUMBER_ID}/messages`, {
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      text: { body: input.text, preview_url: false },
      to: input.recipientId,
      type: "text"
    }),
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    method: "POST"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(JSON.stringify(data));
  const messages = Array.isArray((data as { messages?: unknown[] }).messages) ? (data as { messages?: Array<{ id?: string }> }).messages : [];
  return { externalMessageId: messages?.[0]?.id, ok: true };
}

export async function sendWhatsappCloudMedia(env: Env, input: SendTextInput & { body?: string; mediaMimeType?: string; mediaUrl: string; messageType: string }) {
  const accessToken = env.WHATSAPP_ACCESS_TOKEN || env.META_PAGE_ACCESS_TOKEN;

  if (!env.META_PHONE_NUMBER_ID || !accessToken) {
    throw new Error("WhatsApp Cloud API nao esta configurado.");
  }

  if (!input.mediaUrl.startsWith("https://")) {
    throw new Error("Para enviar midia no WhatsApp, o arquivo precisa de uma URL publica HTTPS.");
  }

  const type = input.messageType === "audio" || input.messageType === "video" || input.messageType === "image"
    ? input.messageType
    : "document";
  const mediaPayload = type === "document"
    ? { link: input.mediaUrl, filename: input.body?.split(" (")[0] || "arquivo" }
    : { link: input.mediaUrl, ...(input.body && type !== "audio" ? { caption: input.body } : {}) };

  const response = await fetch(`https://graph.facebook.com/v20.0/${env.META_PHONE_NUMBER_ID}/messages`, {
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.recipientId,
      type,
      [type]: mediaPayload
    }),
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    method: "POST"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(JSON.stringify(data));
  const messages = Array.isArray((data as { messages?: unknown[] }).messages) ? (data as { messages?: Array<{ id?: string }> }).messages : [];
  return { externalMessageId: messages?.[0]?.id, ok: true };
}

export const whatsappCloudAdapter: MessageAdapter = {
  channel: "whatsapp",
  normalizeInbound: normalizeWhatsappCloudPayload,
  sendText: sendWhatsappCloudText
};
