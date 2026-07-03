#!/usr/bin/env bash
set -euo pipefail

npm run check:env
npm run check:secrets
npm run build

if [ "${CONFIRM_PRODUCTION_DEPLOY:-no}" != "yes" ]; then
  echo "Production deploy blocked. Set CONFIRM_PRODUCTION_DEPLOY=yes to continue."
  exit 1
fi

npm run deploy:worker
npm run deploy:pages
mkdir -p .codex-log
printf '%s production deploy finished\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .codex-log/deploy.log
