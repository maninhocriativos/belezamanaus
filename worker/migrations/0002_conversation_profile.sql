alter table chat_conversations add column channel text;
alter table chat_conversations add column contact_name text;
alter table chat_conversations add column contact_avatar_url text;
alter table chat_conversations add column contact_phone text;
alter table chat_conversations add column presence_status text;
alter table chat_conversations add column is_typing integer not null default 0;
alter table chat_conversations add column last_seen_at text;
