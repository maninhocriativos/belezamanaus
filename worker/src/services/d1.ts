import type { ChatMessageInput } from "../types/chat";

export async function listMessages(db: D1Database, conversationId?: string) {
  const statement = conversationId
    ? db.prepare("select * from chat_messages where conversation_id = ? order by created_at asc limit 100").bind(conversationId)
    : db.prepare("select * from chat_messages order by created_at asc limit 100");
  const { results } = await statement.all();
  return { messages: results ?? [] };
}

export async function listConversations(db: D1Database) {
  const { results } = await db
    .prepare(
      "select c.id, c.lead_id, c.organization_id, c.status, c.last_message_at, m.body as last_message, m.message_type as last_message_type, m.sender_type from chat_conversations c left join chat_messages m on m.id = (select id from chat_messages where conversation_id = c.id order by created_at desc limit 1) order by c.last_message_at desc limit 100"
    )
    .all();

  return { conversations: results ?? [] };
}

export async function saveMessage(db: D1Database, message: ChatMessageInput) {
  if (message.externalMessageId) {
    const existing = await db
      .prepare("select id from chat_messages where external_message_id = ? limit 1")
      .bind(message.externalMessageId)
      .first<{ id: string }>();

    if (existing?.id) {
      await db
        .prepare("update chat_conversations set last_message_at = datetime('now'), updated_at = datetime('now') where id = ?")
        .bind(message.conversationId)
        .run();

      return { id: existing.id, ...message, status: message.status ?? "sent", deduped: true, created_at: new Date().toISOString() };
    }
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      "insert into chat_conversations (id, lead_id, organization_id, status, last_message_at, created_at, updated_at) values (?, ?, ?, 'open', datetime('now'), datetime('now'), datetime('now')) on conflict(id) do update set last_message_at = datetime('now'), updated_at = datetime('now')"
    )
    .bind(message.conversationId, message.leadId, message.organizationId)
    .run();

  await db
    .prepare(
      "insert into chat_messages (id, conversation_id, lead_id, organization_id, direction, sender_type, message_type, body, media_url, media_mime_type, media_size, external_message_id, status, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
    )
    .bind(
      id,
      message.conversationId,
      message.leadId,
      message.organizationId,
      message.direction,
      message.senderType,
      message.messageType,
      message.body,
      message.mediaUrl ?? null,
      message.mediaMimeType ?? null,
      message.mediaSize ?? null,
      message.externalMessageId ?? null,
      message.status ?? "sent"
    )
    .run();

  return { id, ...message, status: message.status ?? "sent", created_at: new Date().toISOString() };
}

export async function saveWebhookLog(db: D1Database, input: { eventType?: string; payload: unknown; provider: string; status: string }) {
  const id = crypto.randomUUID();

  await db
    .prepare("insert into webhook_logs (id, provider, event_type, payload, status, created_at) values (?, ?, ?, ?, ?, datetime('now'))")
    .bind(id, input.provider, input.eventType ?? null, JSON.stringify(input.payload).slice(0, 12000), input.status)
    .run();

  return { id, ...input };
}
