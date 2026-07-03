# Arquitetura

O Fisiolipo CRM e dividido em:

* `app/`: frontend React/Vite.
* `worker/`: API e webhooks em Cloudflare Workers.
* `supabase/`: schema, migrations, seed e policies do banco principal.
* `worker/migrations/`: banco D1 para chat e eventos rapidos.
* `scripts/`: automacoes locais e deploy controlado.

Supabase guarda dados principais: usuarios, organizacoes, leads, vendas, campanhas, configuracoes e agente.
D1 guarda mensagens, eventos do chat, recibos e logs rapidos de webhook.
