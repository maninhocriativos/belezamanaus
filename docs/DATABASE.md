# Banco de dados

## Supabase/Postgres

Dados principais ficam em Supabase com RLS ativado. A migration inicial cria tabelas de organizacoes, leads, vendas, campanhas, agente, eventos Meta e auditoria.
As policies de acesso por organizacao ficam em `supabase/migrations/0002_rls_membership_policies.sql`.

## Aplicar migrations

No Supabase Dashboard:

1. Abra o projeto.
2. Entre em SQL Editor.
3. Execute `supabase/migrations/0001_initial_schema.sql`.
4. Execute `supabase/migrations/0002_rls_membership_policies.sql`.
5. Execute `supabase/seed.sql`.

## Organizacao inicial

* Nome: Beleza Manaus
* Primeiro administrador planejado: maninhocriativos@gmail.com

O seed cria a organizacao. O vinculo do administrador deve ser aplicado depois que esse e-mail existir em Supabase Auth.

## Cloudflare D1

Mensagens e eventos rapidos ficam no D1. A migration `worker/migrations/0001_chat.sql` cria conversas, mensagens, midias, recibos, digitacao, status de entrega e logs de webhook.
