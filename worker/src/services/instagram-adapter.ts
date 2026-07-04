import type { Env } from "../env";
import type { NormalizedMessage } from "../types/chat";
import { asObject, getText, normalizeAttachmentType, type MessageAdapter, type SendTextInput } from "./message-adapter";

export function normalizeInstagramMessagingPayload(payload: unknown): NormalizedMessage[] {
  const root = asObject(payload);
  const entries = Array.isArray(root.entry) ? root.entry : [];
  const messages: NormalizedMessage[] = [];

  for (const entry of entries) {
    const messaging = Array.isArray(asObject(entry).messaging) ? asObject(entry).messaging as unknown[] : [];
    for (const event of messaging) {
      const item = asObject(event);
      const sender = asObject(item.sender);
      const message = asObject(item.message);
      const senderId = getText(sender.id);
      const text = getText(message.text);
      const externalMessageId = getText(message.mid);
      const attachments = Array.isArray(message.attachments) ? message.attachments as unknown[] : [];

      if (senderId && text) {
        messages.push({
          body: text,
          channel: "instagram",
          direction: "inbound",
          externalConversationId: senderId,
          externalMessageId,
          messageType: "text",
          rawPayload: event,
          senderId
        });
      }

      for (const rawAttachment of attachments) {
        const attachment = asObject(rawAttachment);
        const type = normalizeAttachmentType(getText(attachment.type));
        const attachmentPayload = asObject(attachment.payload);
        const mediaUrl = getText(attachmentPayload.url);

        if (senderId && type !== "text") {
          messages.push({
            body: `[${type} recebido via Instagram]`,
            channel: "instagram",
            direction: "inbound",
            externalConversationId: senderId,
            externalMessageId,
            mediaUrl,
            messageType: type,
            rawPayload: event,
            senderId
          });
        }
      }
    }
  }

  return messages;
}

export async function sendInstagramText(env: Env, input: SendTextInput) {
  const endpointId = env.META_INSTAGRAM_ACCOUNT_ID || env.META_PAGE_ID || "me";
  const response = await fetch(`https://graph.facebook.com/v20.0/${endpointId}/messages?access_token=${encodeURIComponent(env.META_PAGE_ACCESS_TOKEN)}`, {
    body: JSON.stringify({
      messaging_type: "RESPONSE",
      message: { text: input.text },
      recipient: { id: input.recipientId }
    }),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(JSON.stringify(data));
  return { externalMessageId: (data as { message_id?: string }).message_id, ok: true };
}

export const instagramAdapter: MessageAdapter = {
  channel: "instagram",
  normalizeInbound: normalizeInstagramMessagingPayload,
  sendText: sendInstagramText
};
