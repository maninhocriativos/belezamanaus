# Banco de dados

## Supabase/Postgres

Dados principais ficam em Supabase com RLS ativado. A migration inicial cria tabelas de organizacoes, leads, vendas, campanhas, agente, eventos Meta e auditoria.

## Organizacao inicial

* Nome: Beleza Manaus
* Primeiro administrador planejado: maninhocriativos@gmail.com

O seed cria a organizacao. O vinculo do administrador deve ser aplicado depois que esse e-mail existir em Supabase Auth.

## Cloudflare D1

Mensagens e eventos rapidos ficam no D1. A migration `worker/migrations/0001_chat.sql` cria conversas, mensagens, midias, recibos, digitacao, status de entrega e logs de webhook.
