create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id),
  full_name text,
  role text not null default 'agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'agent',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  source text,
  source_platform text,
  meta_leadgen_id text unique,
  meta_page_id text,
  meta_form_id text,
  meta_campaign_id text,
  meta_campaign_name text,
  meta_adset_id text,
  meta_adset_name text,
  meta_ad_id text,
  meta_ad_name text,
  status text not null default 'new',
  temperature text not null default 'warm',
  lead_score integer not null default 0,
  assigned_to uuid references auth.users(id),
  agent_enabled boolean not null default true,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lead_sources (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), name text not null, created_at timestamptz not null default now());
create table if not exists lead_status_history (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), lead_id uuid not null references leads(id), from_status text, to_status text not null, user_id uuid references auth.users(id), created_at timestamptz not null default now());
create table if not exists lead_notes (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), lead_id uuid not null references leads(id), user_id uuid references auth.users(id), note text not null, created_at timestamptz not null default now());
create table if not exists procedures (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), name text not null, price numeric(12,2), active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists campaigns (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), name text not null, source_platform text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists ad_accounts (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), platform text not null default 'meta', external_id text not null, name text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists ad_campaigns (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), ad_account_id uuid references ad_accounts(id), external_id text not null, name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists ad_sets (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), ad_campaign_id uuid references ad_campaigns(id), external_id text not null, name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists ads (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), ad_set_id uuid references ad_sets(id), external_id text not null, name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists appointments (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), lead_id uuid references leads(id), user_id uuid references auth.users(id), scheduled_at timestamptz not null, status text not null default 'scheduled', notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists sales (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), lead_id uuid references leads(id), user_id uuid references auth.users(id), procedure_id uuid references procedures(id), procedure_name text, amount numeric(12,2) not null default 0, payment_method text, payment_status text, sale_status text not null default 'completed', campaign_id uuid references campaigns(id), ad_id uuid references ads(id), notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists quick_replies (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), title text not null, body text not null, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists saved_messages (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), title text not null, body text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists agent_profiles (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), name text not null, tone text, initial_message text, active boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists agent_knowledge_base (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), title text not null, content text not null, category text, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists agent_memories (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), lead_id uuid references leads(id), memory text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists agent_lead_summaries (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), lead_id uuid not null references leads(id), summary text not null, intent text, objections text, temperature text, score integer, next_action text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists agent_conversation_state (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), lead_id uuid not null references leads(id), state jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists agent_actions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), lead_id uuid references leads(id), action_type text not null, decision_reason text, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table if not exists agent_handoffs (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), lead_id uuid not null references leads(id), reason text not null, assigned_to uuid references auth.users(id), created_at timestamptz not null default now());
create table if not exists agent_guardrails (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), rule_type text not null, content text not null, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists meta_events_sent (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id), lead_id uuid references leads(id), event_name text not null, event_id text not null unique, payload_hash text, sent_at timestamptz not null default now());
create table if not exists audit_logs (id uuid primary key default gen_random_uuid(), organization_id uuid references organizations(id), actor_id uuid references auth.users(id), action text not null, target_type text, target_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

create index if not exists idx_leads_organization_id on leads(organization_id);
create index if not exists idx_leads_created_at on leads(created_at);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_phone on leads(phone);
create index if not exists idx_leads_meta_leadgen_id on leads(meta_leadgen_id);
create index if not exists idx_sales_lead_id on sales(lead_id);
create index if not exists idx_sales_organization_id on sales(organization_id);
create index if not exists idx_sales_created_at on sales(created_at);
create index if not exists idx_meta_events_sent_event_id on meta_events_sent(event_id);

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table organization_members enable row level security;
alter table leads enable row level security;
alter table lead_sources enable row level security;
alter table lead_status_history enable row level security;
alter table lead_notes enable row level security;
alter table procedures enable row level security;
alter table campaigns enable row level security;
alter table ad_accounts enable row level security;
alter table ad_campaigns enable row level security;
alter table ad_sets enable row level security;
alter table ads enable row level security;
alter table appointments enable row level security;
alter table sales enable row level security;
alter table quick_replies enable row level security;
alter table saved_messages enable row level security;
alter table agent_profiles enable row level security;
alter table agent_knowledge_base enable row level security;
alter table agent_memories enable row level security;
alter table agent_lead_summaries enable row level security;
alter table agent_conversation_state enable row level security;
alter table agent_actions enable row level security;
alter table agent_handoffs enable row level security;
alter table agent_guardrails enable row level security;
alter table meta_events_sent enable row level security;
alter table audit_logs enable row level security;

drop policy if exists "members can read organization rows" on organizations;
create policy "members can read organization rows" on organizations for select using (
  exists (select 1 from organization_members om where om.organization_id = id and om.user_id = auth.uid())
);

drop policy if exists "members can read own profile" on profiles;
create policy "members can read own profile" on profiles for select using (id = auth.uid() or exists (
  select 1 from organization_members om where om.organization_id = profiles.organization_id and om.user_id = auth.uid()
));
