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
