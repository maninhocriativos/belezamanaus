#!/usr/bin/env bash
set -euo pipefail

npm --workspace @fisiolipo/app run lint
npm --workspace @fisiolipo/app run build
npm --workspace @fisiolipo/worker run build
