import type { ChatMessageInput } from "../types/chat";

function normalizeStatus(value: unknown): ChatMessageInput["status"] {
  if (value === "sending" || value === "sent" || value === "delivered" || value === "read" || value === "failed") return value;
  return "sent";
}

function normalizeConversationMeta(payload: any): ChatMessageInput["conversationMeta"] {
  const meta = typeof payload?.conversationMeta === "object" && payload.conversationMeta !== null ? payload.conversationMeta : {};
  return {
    avatarUrl: meta.avatarUrl ? String(meta.avatarUrl) : undefined,
    channel: meta.channel ? String(meta.channel) : undefined,
    contactName: meta.contactName ? String(meta.contactName) : undefined,
    contactPhone: meta.contactPhone ? String(meta.contactPhone) : undefined,
    isTyping: Boolean(meta.isTyping),
    presenceStatus: meta.presenceStatus ? String(meta.presenceStatus) : undefined
  };
}

export function normalizeMessage(payload: any): ChatMessageInput {
  return {
    conversationMeta: normalizeConversationMeta(payload),
    conversationId: String(payload.conversationId ?? "mock-conversation"),
    leadId: String(payload.leadId ?? "mock-lead"),
    organizationId: String(payload.organizationId ?? "mock-org"),
    direction: payload.direction === "inbound" ? "inbound" : "outbound",
    senderType: String(payload.senderType ?? "user"),
    messageType: String(payload.messageType ?? "text"),
    body: String(payload.body ?? ""),
    externalMessageId: payload.externalMessageId ? String(payload.externalMessageId) : undefined,
    mediaId: payload.mediaId ? String(payload.mediaId) : undefined,
    mediaMimeType: payload.mediaMimeType ? String(payload.mediaMimeType) : undefined,
    mediaSize: Number.isFinite(Number(payload.mediaSize)) ? Number(payload.mediaSize) : undefined,
    mediaUrl: payload.mediaUrl ? String(payload.mediaUrl) : undefined,
    rawPayload: payload.rawPayload,
    senderId: payload.senderId ? String(payload.senderId) : undefined,
    senderName: payload.senderName ? String(payload.senderName) : undefined,
    status: normalizeStatus(payload.status)
  };
}
