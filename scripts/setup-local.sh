#!/usr/bin/env bash
set -euo pipefail

mkdir -p .secrets

if [ ! -f .secrets/.env.local ]; then
  cp .secrets/.env.production .secrets/.env.local
fi

npm install

echo "Local setup complete. Fill .secrets/.env.local, then run npm run dev."
