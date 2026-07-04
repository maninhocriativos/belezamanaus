export type ChatMessageInput = {
  conversationId: string;
  leadId: string;
  organizationId: string;
  direction: "inbound" | "outbound";
  senderType: string;
  messageType: string;
  body: string;
  externalMessageId?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  mediaUrl?: string;
  status?: "failed" | "sent";
};
