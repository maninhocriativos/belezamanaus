create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.current_user_organization_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select om.organization_id
  from public.organization_members om
  where om.user_id = auth.uid();
$$;

drop policy if exists "members can read organization rows" on organizations;
create policy "members can read organization rows"
on organizations for select
using (public.is_organization_member(id));

drop policy if exists "members can read own profile" on profiles;
drop policy if exists "members can read profiles in same organization" on profiles;
create policy "members can read profiles in same organization"
on profiles for select
using (id = auth.uid() or public.is_organization_member(organization_id));

drop policy if exists "users can update own profile" on profiles;
create policy "users can update own profile"
on profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "members can read organization members" on organization_members;
create policy "members can read organization members"
on organization_members for select
using (public.is_organization_member(organization_id));

drop policy if exists "members can read leads" on leads;
create policy "members can read leads"
on leads for select
using (public.is_organization_member(organization_id));

drop policy if exists "members can manage leads" on leads;
create policy "members can manage leads"
on leads for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage sales" on sales;
create policy "members can manage sales"
on sales for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage lead notes" on lead_notes;
create policy "members can manage lead notes"
on lead_notes for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage lead status history" on lead_status_history;
create policy "members can manage lead status history"
on lead_status_history for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage appointments" on appointments;
create policy "members can manage appointments"
on appointments for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage commercial config" on procedures;
create policy "members can manage commercial config"
on procedures for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage quick replies" on quick_replies;
create policy "members can manage quick replies"
on quick_replies for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage saved messages" on saved_messages;
create policy "members can manage saved messages"
on saved_messages for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage campaigns" on campaigns;
create policy "members can manage campaigns"
on campaigns for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage ad accounts" on ad_accounts;
create policy "members can manage ad accounts"
on ad_accounts for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage ad campaigns" on ad_campaigns;
create policy "members can manage ad campaigns"
on ad_campaigns for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage ad sets" on ad_sets;
create policy "members can manage ad sets"
on ad_sets for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage ads" on ads;
create policy "members can manage ads"
on ads for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage agent profiles" on agent_profiles;
create policy "members can manage agent profiles"
on agent_profiles for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage agent knowledge" on agent_knowledge_base;
create policy "members can manage agent knowledge"
on agent_knowledge_base for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage agent memories" on agent_memories;
create policy "members can manage agent memories"
on agent_memories for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage agent summaries" on agent_lead_summaries;
create policy "members can manage agent summaries"
on agent_lead_summaries for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage agent state" on agent_conversation_state;
create policy "members can manage agent state"
on agent_conversation_state for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can read agent actions" on agent_actions;
create policy "members can read agent actions"
on agent_actions for select
using (public.is_organization_member(organization_id));

drop policy if exists "members can manage handoffs" on agent_handoffs;
create policy "members can manage handoffs"
on agent_handoffs for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can manage guardrails" on agent_guardrails;
create policy "members can manage guardrails"
on agent_guardrails for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can read meta events" on meta_events_sent;
create policy "members can read meta events"
on meta_events_sent for select
using (public.is_organization_member(organization_id));

drop policy if exists "members can read audit logs" on audit_logs;
create policy "members can read audit logs"
on audit_logs for select
using (organization_id is null or public.is_organization_member(organization_id));
