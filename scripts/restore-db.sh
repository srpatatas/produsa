#!/bin/bash
# Restore DB from JSON backup
# Usage:
#   bash scripts/restore-db.sh backups/2026-05-28_prod.json

if [ -z "$1" ]; then
  echo "Usage: bash scripts/restore-db.sh <backup-file>"
  exit 1
fi

cd "$(dirname "$0")/.."
npx tsc scripts/restore-db.ts --outDir "$TMPDIR/produsa-db-scripts" --esModuleInterop --module commonjs --target es2020 --moduleResolution node --skipLibCheck 2>/dev/null
NODE_PATH=./node_modules node "$TMPDIR/produsa-db-scripts/restore-db.js" "$1"
