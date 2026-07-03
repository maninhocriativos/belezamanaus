#!/usr/bin/env bash
set -euo pipefail

npm run check:env
npm --workspace @fisiolipo/app run dev &
npm --workspace @fisiolipo/worker run dev &
wait
