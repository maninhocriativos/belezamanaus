# Fisiolipo CRM

Fundacao do CRM premium da Fisiolipo para captacao de leads, chat interno, vendas, agente automatizada e performance de anuncios.

## Stack

* React + Vite + TypeScript no frontend.
* Tailwind CSS com tema rosa/branco e modo escuro.
* Cloudflare Workers para API e webhooks.
* Cloudflare D1 para mensagens/eventos rapidos.
* Supabase/Postgres + Supabase Auth para dados principais.

## Primeiros passos

1. Preencha os placeholders em `.secrets/.env.local`.
2. Rode `npm install`.
3. Rode `npm run dev`.

Antes de deploy em producao, use `npm run deploy:production` somente com `CONFIRM_PRODUCTION_DEPLOY=yes` e secrets reais configurados no ambiente correto.
