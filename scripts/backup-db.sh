#!/bin/bash
# Backup DB to JSON file
# Usage:
#   bash scripts/backup-db.sh          # backup dev
#   bash scripts/backup-db.sh --prod   # backup prod

cd "$(dirname "$0")/.."
npx tsc scripts/backup-db.ts --outDir "$TMPDIR/produsa-db-scripts" --esModuleInterop --module commonjs --target es2020 --moduleResolution node --skipLibCheck 2>/dev/null
NODE_PATH=./node_modules node "$TMPDIR/produsa-db-scripts/backup-db.js" "$@"
