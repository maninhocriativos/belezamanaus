# Secrets

Arquivos reais de secrets ficam somente em `.secrets/`, ignorados pelo Git.

## Frontend publico

Preencher em `.env.example` apenas nomes publicos e vazios:

* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`
* `VITE_APP_URL`
* `VITE_API_URL`

## Backend/Worker

Preencher localmente em `.secrets/.env.local`:

### Supabase

```text
# URL publica do projeto Supabase.
SUPABASE_URL=

# Chave anon publica usada por rotas que nao exigem service role.
SUPABASE_ANON_KEY=

# Chave administrativa. Nunca colocar no frontend.
SUPABASE_SERVICE_ROLE_KEY=

# URL direta/pooler do Postgres para migracoes.
SUPABASE_DB_URL=

# Senha do banco usada pelo script de migracao.
SUPABASE_DB_PASSWORD=
```

### Meta App, Facebook e Instagram

```text
# ID e segredo do app criado no Meta Developers.
META_APP_ID=
META_APP_SECRET=

# Token usado para verificar o webhook.
META_VERIFY_TOKEN=

# ID da Pagina do Facebook conectada.
META_PAGE_ID=

# Token da Pagina com permissoes de Messenger/Instagram.
META_PAGE_ACCESS_TOKEN=

# ID da conta profissional do Instagram conectada a Pagina.
META_INSTAGRAM_ACCOUNT_ID=

# Ative somente se a Meta aprovou a permissao HUMAN_AGENT.
META_HUMAN_AGENT_ENABLED=false
```

### WhatsApp API

```text
# ID do numero no WhatsApp Cloud API.
# Meta Developers > WhatsApp > API Setup > Phone number ID.
META_PHONE_NUMBER_ID=

# Token do WhatsApp Cloud API.
# Pode ser token permanente do Business Manager/System User.
WHATSAPP_ACCESS_TOKEN=

# Opcional: se usar o mesmo token da Pagina/Meta para teste,
# o worker tenta META_PAGE_ACCESS_TOKEN quando WHATSAPP_ACCESS_TOKEN estiver vazio.
```

### Meta Ads e Conversoes

```text
# ID da conta de anuncios. Pode ser com ou sem act_.
META_AD_ACCOUNT_ID=

# ID do Business Manager.
META_BUSINESS_ID=

# Pixel usado para eventos de conversao.
META_PIXEL_ID=

# Token com permissao para Conversions API e leitura de insights.
META_CONVERSIONS_ACCESS_TOKEN=
```

### Cloudflare

```text
# Conta Cloudflare.
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Banco D1 usado pelo chat.
CLOUDFLARE_D1_DATABASE_ID=

# Projeto Cloudflare Pages.
CLOUDFLARE_PAGES_PROJECT_NAME=

# Bucket R2 usado para audios, imagens e documentos do chat.
# O projeto usa binding MEDIA_BUCKET no worker/wrangler.toml.
CLOUDFLARE_R2_BUCKET_NAME=belezamanaus-media

# Opcional. Se ficar vazio, o Worker serve os arquivos em /media/<chave>.
R2_PUBLIC_BASE_URL=
```

### Inteligencia do agente

```text
# Provedor de IA. Hoje o worker usa openai quando configurado.
AI_PROVIDER=openai

# Chave da API de IA.
AI_API_KEY=

# Modelo usado pelo agente. Se vazio, usa gpt-4.1-mini.
AI_MODEL=

# Provedores futuros para transcricao/visao.
AUDIO_TRANSCRIPTION_PROVIDER=openai
IMAGE_UNDERSTANDING_PROVIDER=openai
```

### Outros

```text
GITHUB_TOKEN=
APP_ENV=production
APP_URL=
API_URL=
CONFIRM_PRODUCTION_DEPLOY=true
```

Nunca usar `SUPABASE_SERVICE_ROLE_KEY` no frontend.

## Onde colar agora

No arquivo local `.secrets/.env.local`, preencha sem aspas:

```text
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=SUA_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
SUPABASE_DB_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
SUPABASE_DB_PASSWORD=SUA_SENHA_DO_BANCO
```

`SUPABASE_DB_PASSWORD` pode ter caracteres especiais. O script `npm run db:migrate` codifica a senha automaticamente quando a URL contem `[YOUR-PASSWORD]`.

No Cloudflare Pages, em variaveis de ambiente, preencha somente:

```text
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

Nunca colocar `SUPABASE_SERVICE_ROLE_KEY` no Cloudflare Pages.
