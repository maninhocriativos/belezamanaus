import type { ChatMessageInput } from "../types/chat";
import { transcribeAudio } from "./audio-transcription";
import { describeImage } from "./image-understanding";

let schemaReady: Promise<void> | null = null;

async function runSchemaStatement(db: D1Database, sql: string) {
  try {
    await db.prepare(sql).run();
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("duplicate column") || message.includes("already exists")) return;
    throw error;
  }
}

export async function ensureLocalFirstChatSchema(db: D1Database) {
  schemaReady ??= (async () => {
    await runSchemaStatement(db, "alter table chat_conversations add column last_message text");
    await runSchemaStatement(db, "alter table chat_conversations add column last_message_type text");
    await runSchemaStatement(db, "alter table chat_conversations add column last_message_direction text");
    await runSchemaStatement(db, "alter table chat_conversations add column unread_count integer not null default 0");
    await runSchemaStatement(db, "alter table chat_messages add column media_id text");
    await runSchemaStatement(db, "alter table chat_messages add column raw_payload text");
    await runSchemaStatement(db, "alter table chat_messages add column delivered_at text");
    await runSchemaStatement(db, "alter table chat_messages add column read_at text");
    await runSchemaStatement(db, "alter table chat_messages add column failed_reason text");
    await runSchemaStatement(db, "create index if not exists idx_chat_messages_conversation_cursor on chat_messages(conversation_id, created_at, id)");
    await runSchemaStatement(db, "create index if not exists idx_chat_messages_conversation_desc on chat_messages(conversation_id, created_at desc, id desc)");
    await runSchemaStatement(db, "create index if not exists idx_chat_conversations_last_message_at on chat_conversations(last_message_at desc)");
  })();

  return schemaReady;
}

type ListMessagesOptions = {
  beforeCreatedAt?: string;
  beforeId?: string;
  conversationId?: string;
  limit?: number;
};

function normalizeLimit(value?: number) {
  const limit = Number(value);
  if (!Number.isFinite(limit)) return 50;
  return Math.min(Math.max(Math.trunc(limit), 1), 50);
}

export async function listMessages(db: D1Database, options: ListMessagesOptions = {}) {
  await ensureLocalFirstChatSchema(db);
  const limit = normalizeLimit(options.limit);
  const conversationId = options.conversationId;

  if (!conversationId) {
    const { results } = await db
      .prepare("select * from chat_messages order by created_at desc, id desc limit ?")
      .bind(limit)
      .all();
    return { messages: [...(results ?? [])].reverse(), nextCursor: null };
  }

  const hasCursor = Boolean(options.beforeCreatedAt && options.beforeId);
  const statement = hasCursor
    ? db
        .prepare(
          "select * from chat_messages where conversation_id = ? and (created_at < ? or (created_at = ? and id < ?)) order by created_at desc, id desc limit ?"
        )
        .bind(conversationId, options.beforeCreatedAt, options.beforeCreatedAt, options.beforeId, limit)
    : db
        .prepare("select * from chat_messages where conversation_id = ? order by created_at desc, id desc limit ?")
        .bind(conversationId, limit);

  const { results } = await statement.all();
  const messages = [...(results ?? [])].reverse();
  const oldest = messages[0] as { created_at?: string; id?: string } | undefined;

  return {
    messages,
    nextCursor: messages.length === limit && oldest?.created_at && oldest?.id
      ? { beforeCreatedAt: oldest.created_at, beforeId: oldest.id }
      : null
  };
}

export async function listConversations(db: D1Database) {
  await ensureLocalFirstChatSchema(db);
  const { results } = await db
    .prepare(
      "select c.id, c.lead_id, c.organization_id, c.status, c.channel, c.contact_name, c.contact_avatar_url, c.contact_phone, c.presence_status, c.is_typing, c.last_seen_at, c.last_message_at, c.last_message, c.last_message_type, c.unread_count, m.sender_type from chat_conversations c left join chat_messages m on m.id = (select id from chat_messages where conversation_id = c.id order by created_at desc, id desc limit 1) order by c.last_message_at desc limit 100"
    )
    .all();

  return { conversations: results ?? [] };
}

function channelFromConversationId(conversationId: string) {
  const separatorIndex = conversationId.indexOf(":");
  if (separatorIndex < 0) return null;
  const channel = conversationId.slice(0, separatorIndex);
  return channel || null;
}

export async function findRecentOutboundText(db: D1Database, input: { body: string; conversationId: string; minutes?: number }) {
  await ensureLocalFirstChatSchema(db);
  const minutes = Math.max(1, input.minutes ?? 5);
  return db
    .prepare(
      "select id, body, status from chat_messages where conversation_id = ? and direction = 'outbound' and body = ? and created_at >= datetime('now', ?) order by created_at desc limit 1"
    )
    .bind(input.conversationId, input.body, `-${minutes} minutes`)
    .first<{ id: string; body: string; status: string }>();
}

export async function getConversationStatus(db: D1Database, conversationId: string) {
  await ensureLocalFirstChatSchema(db);
  const conversation = await db
    .prepare("select status from chat_conversations where id = ? limit 1")
    .bind(conversationId)
    .first<{ status: string }>();

  return conversation?.status ?? null;
}

export async function findLatestInboundMessageAt(db: D1Database, conversationId: string) {
  await ensureLocalFirstChatSchema(db);
  const message = await db
    .prepare("select created_at from chat_messages where conversation_id = ? and direction = 'inbound' order by created_at desc, id desc limit 1")
    .bind(conversationId)
    .first<{ created_at: string }>();

  return message?.created_at ?? null;
}

export async function transferConversationToHuman(db: D1Database, input: { conversationId: string; payload: unknown; status: string }) {
  await ensureLocalFirstChatSchema(db);

  await db
    .prepare("update chat_conversations set status = ?, updated_at = datetime('now') where id = ?")
    .bind(input.status, input.conversationId)
    .run();

  await db
    .prepare("insert into chat_events (id, conversation_id, event_type, payload, created_at) values (?, ?, ?, ?, datetime('now'))")
    .bind(crypto.randomUUID(), input.conversationId, "human_handoff", JSON.stringify(input.payload).slice(0, 12000))
    .run();
}

export async function saveMessage(db: D1Database, message: ChatMessageInput) {
  await ensureLocalFirstChatSchema(db);
  const existing = message.externalMessageId
    ? await db
        .prepare("select id from chat_messages where external_message_id = ? limit 1")
        .bind(message.externalMessageId)
        .first<{ id: string }>()
    : null;

  const conversationStatement = existing?.id
    ? "insert into chat_conversations (id, lead_id, organization_id, status, channel, contact_name, contact_avatar_url, contact_phone, presence_status, is_typing, last_seen_at, last_message_at, last_message, last_message_type, last_message_direction, unread_count, created_at, updated_at) values (?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?, ?, datetime('now'), datetime('now')) on conflict(id) do update set updated_at = datetime('now'), channel = coalesce(excluded.channel, chat_conversations.channel), contact_name = coalesce(excluded.contact_name, chat_conversations.contact_name), contact_avatar_url = coalesce(excluded.contact_avatar_url, chat_conversations.contact_avatar_url), contact_phone = coalesce(excluded.contact_phone, chat_conversations.contact_phone), presence_status = coalesce(excluded.presence_status, chat_conversations.presence_status), is_typing = excluded.is_typing, last_seen_at = datetime('now')"
    : "insert into chat_conversations (id, lead_id, organization_id, status, channel, contact_name, contact_avatar_url, contact_phone, presence_status, is_typing, last_seen_at, last_message_at, last_message, last_message_type, last_message_direction, unread_count, created_at, updated_at) values (?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?, ?, datetime('now'), datetime('now')) on conflict(id) do update set last_message_at = datetime('now'), last_message = excluded.last_message, last_message_type = excluded.last_message_type, last_message_direction = excluded.last_message_direction, unread_count = case when excluded.last_message_direction = 'inbound' then chat_conversations.unread_count + 1 else 0 end, updated_at = datetime('now'), channel = coalesce(excluded.channel, chat_conversations.channel), contact_name = coalesce(excluded.contact_name, chat_conversations.contact_name), contact_avatar_url = coalesce(excluded.contact_avatar_url, chat_conversations.contact_avatar_url), contact_phone = coalesce(excluded.contact_phone, chat_conversations.contact_phone), presence_status = coalesce(excluded.presence_status, chat_conversations.presence_status), is_typing = excluded.is_typing, last_seen_at = datetime('now')";

  await db
    .prepare(conversationStatement)
    .bind(
      message.conversationId,
      message.leadId,
      message.organizationId,
      message.conversationMeta?.channel ?? channelFromConversationId(message.conversationId),
      message.conversationMeta?.contactName ?? null,
      message.conversationMeta?.avatarUrl ?? null,
      message.conversationMeta?.contactPhone ?? null,
      message.conversationMeta?.presenceStatus ?? "online",
      message.conversationMeta?.isTyping ? 1 : 0,
      message.body ?? "",
      message.messageType,
      message.direction,
      message.direction === "inbound" ? 1 : 0
    )
    .run();

  if (existing?.id) {
    return { id: existing.id, ...message, failed_reason: message.failedReason ?? null, status: message.status ?? "sent", deduped: true, created_at: new Date().toISOString() };
  }

  const id = crypto.randomUUID();
  const audioTranscription = message.messageType === "audio" && message.mediaUrl
    ? (await transcribeAudio(message.mediaUrl)).text
    : "";
  const imageDescription = message.messageType === "image" && message.mediaUrl
    ? (await describeImage(message.mediaUrl)).description
    : "";

  await db
    .prepare(
      "insert into chat_messages (id, conversation_id, lead_id, organization_id, direction, sender_type, sender_id, sender_name, message_type, body, media_id, media_url, media_mime_type, media_size, audio_transcription, image_description, external_message_id, status, raw_payload, failed_reason, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
    )
    .bind(
      id,
      message.conversationId,
      message.leadId,
      message.organizationId,
      message.direction,
      message.senderType,
      message.senderId ?? null,
      message.senderName ?? null,
      message.messageType,
      message.body,
      message.mediaId ?? null,
      message.mediaUrl ?? null,
      message.mediaMimeType ?? null,
      message.mediaSize ?? null,
      audioTranscription || null,
      imageDescription || null,
      message.externalMessageId ?? null,
      message.status ?? "sent",
      message.rawPayload ? JSON.stringify(message.rawPayload).slice(0, 12000) : null,
      message.failedReason ?? null
    )
    .run();

  return { id, ...message, failed_reason: message.failedReason ?? null, status: message.status ?? "sent", created_at: new Date().toISOString() };
}

export async function updateMessageStatus(db: D1Database, input: { externalMessageId?: string; messageId?: string; status: string }) {
  await ensureLocalFirstChatSchema(db);
  const message = input.externalMessageId
    ? await db.prepare("select id from chat_messages where external_message_id = ? limit 1").bind(input.externalMessageId).first<{ id: string }>()
    : input.messageId
      ? { id: input.messageId }
      : null;

  if (!message?.id) return null;

  await db
    .prepare(
      "update chat_messages set status = ?, delivered_at = case when ? = 'delivered' then datetime('now') else delivered_at end, read_at = case when ? = 'read' then datetime('now') else read_at end where id = ?"
    )
    .bind(input.status, input.status, input.status, message.id)
    .run();

  await db
    .prepare("insert into chat_delivery_status (id, message_id, status, created_at) values (?, ?, ?, datetime('now'))")
    .bind(crypto.randomUUID(), message.id, input.status)
    .run();

  return { id: message.id, status: input.status };
}

export async function saveWebhookLog(db: D1Database, input: { eventType?: string; payload: unknown; provider: string; status: string }) {
  const id = crypto.randomUUID();

  await db
    .prepare("insert into webhook_logs (id, provider, event_type, payload, status, created_at) values (?, ?, ?, ?, ?, datetime('now'))")
    .bind(id, input.provider, input.eventType ?? null, JSON.stringify(input.payload).slice(0, 12000), input.status)
    .run();

  return { id, ...input };
}
