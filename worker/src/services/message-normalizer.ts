import type { ChatMessageInput } from "../types/chat";

export function normalizeMessage(payload: any): ChatMessageInput {
  return {
    conversationId: String(payload.conversationId ?? "mock-conversation"),
    leadId: String(payload.leadId ?? "mock-lead"),
    organizationId: String(payload.organizationId ?? "mock-org"),
    direction: payload.direction === "inbound" ? "inbound" : "outbound",
    senderType: String(payload.senderType ?? "user"),
    messageType: String(payload.messageType ?? "text"),
    body: String(payload.body ?? ""),
    externalMessageId: payload.externalMessageId ? String(payload.externalMessageId) : undefined,
    mediaMimeType: payload.mediaMimeType ? String(payload.mediaMimeType) : undefined,
    mediaSize: Number.isFinite(Number(payload.mediaSize)) ? Number(payload.mediaSize) : undefined,
    mediaUrl: payload.mediaUrl ? String(payload.mediaUrl) : undefined
  };
}
