import type { ChatMessageInput } from "../types/chat";

export async function listMessages(db: D1Database, conversationId?: string) {
  const statement = conversationId
    ? db.prepare("select * from chat_messages where conversation_id = ? order by created_at asc limit 100").bind(conversationId)
    : db.prepare("select * from chat_messages order by created_at asc limit 100");
  const { results } = await statement.all();
  return { messages: results ?? [] };
}

export async function saveMessage(db: D1Database, message: ChatMessageInput) {
  const id = crypto.randomUUID();
  await db
    .prepare(
      "insert into chat_conversations (id, lead_id, organization_id, status, last_message_at, created_at, updated_at) values (?, ?, ?, 'open', datetime('now'), datetime('now'), datetime('now')) on conflict(id) do update set last_message_at = datetime('now'), updated_at = datetime('now')"
    )
    .bind(message.conversationId, message.leadId, message.organizationId)
    .run();

  await db
    .prepare(
      "insert into chat_messages (id, conversation_id, lead_id, organization_id, direction, sender_type, message_type, body, status, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
    )
    .bind(id, message.conversationId, message.leadId, message.organizationId, message.direction, message.senderType, message.messageType, message.body, "sent")
    .run();

  return { id, ...message, status: "sent", created_at: new Date().toISOString() };
}
