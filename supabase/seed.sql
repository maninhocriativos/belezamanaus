-- Seed inicial seguro. Nao contem secrets.
insert into organizations (name)
values ('Beleza Manaus')
on conflict do nothing;

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
