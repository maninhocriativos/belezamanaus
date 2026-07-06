#!/usr/bin/env bash
set -euo pipefail

export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-${SUPABASE_URL:-}}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-${SUPABASE_ANON_KEY:-}}"
export VITE_API_URL="${VITE_API_URL:-${API_URL:-}}"

npm --workspace @fisiolipo/app run lint
npm --workspace @fisiolipo/app run build
npm --workspace @fisiolipo/worker run build
