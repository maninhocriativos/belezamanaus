#!/usr/bin/env bash
set -euo pipefail

if ! grep -qx ".secrets/" .gitignore; then
  echo ".secrets/ is not ignored in .gitignore"
  exit 1
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  tracked_risks="$(git ls-files '.secrets/*' '.env' '.env.*' ':!:*.env.example' || true)"
  if [ -n "$tracked_risks" ]; then
    echo "Sensitive files are tracked by Git:"
    echo "$tracked_risks"
    exit 1
  fi
else
  echo "Git repository not initialized yet; tracked-secret check skipped."
fi

echo "No tracked local secret files detected."
