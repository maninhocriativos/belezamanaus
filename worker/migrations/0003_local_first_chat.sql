alter table chat_conversations add column last_message text;
alter table chat_conversations add column last_message_type text;
alter table chat_conversations add column last_message_direction text;
alter table chat_conversations add column unread_count integer not null default 0;

alter table chat_messages add column media_id text;
alter table chat_messages add column raw_payload text;
alter table chat_messages add column delivered_at text;
alter table chat_messages add column read_at text;
alter table chat_messages add column failed_reason text;

create index if not exists idx_chat_messages_conversation_cursor on chat_messages(conversation_id, created_at, id);
create index if not exists idx_chat_messages_conversation_desc on chat_messages(conversation_id, created_at desc, id desc);
create index if not exists idx_chat_conversations_last_message_at on chat_conversations(last_message_at desc);
