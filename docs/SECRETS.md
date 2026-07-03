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

* `SUPABASE_URL`
* `SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* `SUPABASE_DB_URL`
* `SUPABASE_DB_PASSWORD`
* `META_APP_ID`
* `META_APP_SECRET`
* `META_VERIFY_TOKEN`
* `META_PAGE_ACCESS_TOKEN`
* `META_AD_ACCOUNT_ID`
* `META_BUSINESS_ID`
* `META_PIXEL_ID`
* `META_CONVERSIONS_ACCESS_TOKEN`
* `CLOUDFLARE_ACCOUNT_ID`
* `CLOUDFLARE_API_TOKEN`
* `CLOUDFLARE_D1_DATABASE_ID`
* `CLOUDFLARE_PAGES_PROJECT_NAME`
* `GITHUB_TOKEN`
* `AI_PROVIDER`
* `AI_API_KEY`
* `AUDIO_TRANSCRIPTION_PROVIDER`
* `IMAGE_UNDERSTANDING_PROVIDER`

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
