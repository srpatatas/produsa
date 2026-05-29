#!/bin/bash
# Refresh the dev DB branch with latest prod data
# Run at the start of each dev session

echo "Resetting dev branch to latest prod data..."
npx --registry https://registry.npmjs.org/ neonctl branches reset dev --project-id blue-bonus-90903915 --parent
echo "✓ Dev DB refreshed with latest prod data"
