export type ChatMessageStatus = "delivered" | "failed" | "read" | "sending" | "sent";

export type ChatChannel = "crm" | "facebook" | "instagram" | "whatsapp";

export type NormalizedMessage = {
  externalMessageId?: string;
  externalConversationId: string;
  channel: ChatChannel;
  direction: "inbound" | "outbound";
  senderId?: string;
  senderName?: string;
  messageType: "audio" | "document" | "image" | "text" | "video";
  body: string;
  mediaId?: string;
  mediaUrl?: string;
  mimeType?: string;
  timestamp?: string;
  rawPayload?: unknown;
};

export type ChatMessageInput = {
  conversationId: string;
  leadId: string;
  organizationId: string;
  direction: "inbound" | "outbound";
  senderType: string;
  messageType: string;
  body: string;
  externalMessageId?: string;
  mediaId?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  mediaUrl?: string;
  rawPayload?: unknown;
  senderId?: string;
  senderName?: string;
  conversationMeta?: {
    avatarUrl?: string;
    channel?: string;
    contactName?: string;
    contactPhone?: string;
    isTyping?: boolean;
    presenceStatus?: string;
  };
  status?: ChatMessageStatus;
};
