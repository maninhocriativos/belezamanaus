export type ChatMessageInput = {
  conversationId: string;
  leadId: string;
  organizationId: string;
  direction: "inbound" | "outbound";
  senderType: string;
  messageType: string;
  body: string;
};
