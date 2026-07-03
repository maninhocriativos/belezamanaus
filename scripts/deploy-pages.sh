#!/usr/bin/env bash
set -euo pipefail

if [ -z "${CLOUDFLARE_PAGES_PROJECT_NAME:-}" ]; then
  echo "CLOUDFLARE_PAGES_PROJECT_NAME is required."
  exit 1
fi

npx wrangler pages deploy app/dist --project-name "$CLOUDFLARE_PAGES_PROJECT_NAME"
