#!/usr/bin/env bash
set -euo pipefail

message="${1:-}"
if [ -z "$message" ]; then
  echo "Usage: npm run commit:deploy -- \"commit message\""
  exit 1
fi

npm run check:secrets
npm run build
git status --short
git add .
git commit -m "$message"
git push

if [ "${CONFIRM_PRODUCTION_DEPLOY:-no}" = "yes" ]; then
  npm run deploy:production
else
  echo "Deploy skipped. Set CONFIRM_PRODUCTION_DEPLOY=yes to deploy production."
fi
