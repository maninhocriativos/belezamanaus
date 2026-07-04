create table if not exists chat_conversations (
  id text primary key,
  lead_id text not null,
  organization_id text not null,
  status text not null default 'open',
  assigned_to text,
  last_message_at text,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists chat_messages (
  id text primary key,
  conversation_id text not null,
  lead_id text not null,
  organization_id text not null,
  direction text not null,
  sender_type text not null,
  sender_id text,
  sender_name text,
  message_type text not null,
  body text,
  media_url text,
  media_mime_type text,
  media_size integer,
  audio_transcription text,
  image_description text,
  external_message_id text,
  status text not null default 'sent',
  created_at text not null default (datetime('now'))
);

create table if not exists chat_message_media (
  id text primary key,
  message_id text not null,
  media_url text not null,
  media_mime_type text,
  media_size integer,
  created_at text not null default (datetime('now'))
);

create table if not exists chat_events (
  id text primary key,
  conversation_id text not null,
  event_type text not null,
  payload text,
  created_at text not null default (datetime('now'))
);

create table if not exists chat_read_receipts (
  id text primary key,
  message_id text not null,
  user_id text not null,
  read_at text not null
);

create table if not exists chat_typing_events (
  id text primary key,
  conversation_id text not null,
  actor_id text,
  is_typing integer not null default 0,
  created_at text not null default (datetime('now'))
);

create table if not exists chat_delivery_status (
  id text primary key,
  message_id text not null,
  status text not null,
  created_at text not null default (datetime('now'))
);

create table if not exists webhook_logs (
  id text primary key,
  provider text not null,
  event_type text,
  payload text,
  status text not null,
  created_at text not null default (datetime('now'))
);

create index if not exists idx_chat_messages_conversation_created on chat_messages(conversation_id, created_at);
create index if not exists idx_chat_messages_lead_created on chat_messages(lead_id, created_at);
create index if not exists idx_chat_messages_org_created on chat_messages(organization_id, created_at);
create index if not exists idx_chat_messages_external_message_id on chat_messages(external_message_id);
