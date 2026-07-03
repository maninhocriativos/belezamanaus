import type { ChatMessageInput } from "../types/chat";

export async function listMessages(db: D1Database) {
  return db.prepare("select * from chat_messages order by created_at desc limit 50").all();
}

export async function saveMessage(db: D1Database, message: ChatMessageInput) {
  const id = crypto.randomUUID();
  await db
    .prepare(
      "insert into chat_messages (id, conversation_id, lead_id, organization_id, direction, sender_type, message_type, body, status, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
    )
    .bind(id, message.conversationId, message.leadId, message.organizationId, message.direction, message.senderType, message.messageType, message.body, "sent")
    .run();

  return { id, ...message, status: "sent" };
}
