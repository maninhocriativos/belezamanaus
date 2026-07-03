#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".secrets/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

required_vars=(
  "APP_ENV"
  "APP_URL"
  "API_URL"
)

for var in "${required_vars[@]}"; do
  if ! grep -q "^${var}=" "$ENV_FILE"; then
    echo "Missing required variable: ${var}"
    exit 1
  fi
done

echo "Environment file exists and required local keys are present."
