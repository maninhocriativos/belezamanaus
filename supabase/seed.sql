-- Seed inicial seguro. Nao contem secrets.
insert into organizations (name)
select 'Beleza Manaus'
where not exists (
  select 1 from organizations where name = 'Beleza Manaus'
);

-- Primeiro administrador planejado:
-- maninhocriativos@gmail.com
--
-- Depois que o usuario existir no Supabase Auth, vincule-o a organizacao:
--
-- insert into organization_members (organization_id, user_id, role)
-- select o.id, u.id, 'owner'
-- from organizations o
-- join auth.users u on u.email = 'maninhocriativos@gmail.com'
-- where o.name = 'Beleza Manaus'
-- on conflict (organization_id, user_id) do nothing;
--
-- update profiles p
-- set organization_id = o.id, role = 'owner'
-- from organizations o
-- where p.id in (select id from auth.users where email = 'maninhocriativos@gmail.com')
--   and o.name = 'Beleza Manaus';

with org as (
  select id from organizations where name = 'Beleza Manaus'
),
admin_user as (
  select id from auth.users where email = 'maninhocriativos@gmail.com'
),
procedure_seed as (
  insert into procedures (organization_id, name, price, active)
  select org.id, item.name, item.price, true
  from org
  cross join (
    values
      ('Avaliacao Fisiolipo', 0::numeric),
      ('Protocolo Reducao de Medidas', 1890::numeric),
      ('Pacote Abdomen e Flancos', 2490::numeric)
  ) as item(name, price)
  where not exists (
    select 1 from procedures p where p.organization_id = org.id and p.name = item.name
  )
  returning id
),
campaign_seed as (
  insert into campaigns (organization_id, name, source_platform)
  select org.id, item.name, 'meta'
  from org
  cross join (
    values
      ('Avaliacao Julho'),
      ('Lead Forms Manaus'),
      ('Remarketing Beleza Manaus')
  ) as item(name)
  where not exists (
    select 1 from campaigns c where c.organization_id = org.id and c.name = item.name
  )
  returning id
),
lead_seed as (
  insert into leads (
    organization_id,
    full_name,
    phone,
    email,
    source,
    source_platform,
    meta_campaign_name,
    status,
    temperature,
    lead_score,
    assigned_to,
    agent_enabled,
    last_message_at
  )
  select
    org.id,
    item.full_name,
    item.phone,
    item.email,
    'Meta Leads',
    'meta',
    item.campaign,
    item.status,
    item.temperature,
    item.score,
    admin_user.id,
    true,
    now() - (item.minutes_ago || ' minutes')::interval
  from org
  left join admin_user on true
  cross join (
    values
      ('Marina Alves', '(92) 99999-0001', 'marina@example.com', 'Avaliacao Julho', 'in_service', 'hot', 86, 8),
      ('Claudia Nascimento', '(92) 99999-0002', 'claudia@example.com', 'Lead Forms Manaus', 'new', 'warm', 61, 42),
      ('Renata Lima', '(92) 99999-0003', 'renata@example.com', 'Remarketing Beleza Manaus', 'qualified', 'hot', 78, 70),
      ('Patricia Souza', '(92) 99999-0004', 'patricia@example.com', 'Avaliacao Julho', 'scheduled', 'warm', 72, 360),
      ('Bianca Rocha', '(92) 99999-0005', 'bianca@example.com', 'Lead Forms Manaus', 'new', 'warm', 55, 520)
  ) as item(full_name, phone, email, campaign, status, temperature, score, minutes_ago)
  where not exists (
    select 1 from leads l where l.organization_id = org.id and l.phone = item.phone
  )
  returning id
)
insert into quick_replies (organization_id, title, body, active)
select org.id, item.title, item.body, true
from org
cross join (
  values
    ('Agendar avaliacao', 'Posso te passar os horarios disponiveis para avaliacao gratuita hoje.'),
    ('Chamar humano', 'Vou chamar uma especialista para continuar seu atendimento agora.'),
    ('Enviar orientacoes', 'Vou te enviar as orientacoes iniciais e confirmar a melhor regiao para avaliacao.')
) as item(title, body)
where not exists (
  select 1 from quick_replies q where q.organization_id = org.id and q.title = item.title
);

insert into agent_profiles (organization_id, name, tone, initial_message, active)
select o.id, 'Aline', 'acolhedor, consultivo e objetivo', 'Oi, eu sou a Aline da Beleza Manaus. Vou te ajudar a entender o melhor caminho para sua avaliacao.', true
from organizations o
where o.name = 'Beleza Manaus'
  and not exists (
    select 1 from agent_profiles a where a.organization_id = o.id and a.name = 'Aline'
  );

insert into agent_knowledge_base (organization_id, title, content, category, active)
select o.id, item.title, item.content, item.category, true
from organizations o
cross join (
  values
    ('Objetivo da avaliacao', 'A avaliacao identifica a regiao de interesse, historico do lead, expectativa e indicacao do protocolo mais adequado.', 'atendimento'),
    ('Regra comercial', 'Nao prometer resultado garantido. Sempre conduzir para avaliacao e atendimento humano quando houver duvida clinica.', 'guardrail'),
    ('Agendamento', 'Priorizar horarios no mesmo dia ou proximo dia util para leads quentes vindos de Meta Leads.', 'agenda')
) as item(title, content, category)
where o.name = 'Beleza Manaus'
  and not exists (
    select 1 from agent_knowledge_base k where k.organization_id = o.id and k.title = item.title
  );
