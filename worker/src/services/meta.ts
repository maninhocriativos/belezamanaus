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
