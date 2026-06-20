#!/usr/bin/env bash
# Publish Veil Move package to Sui testnet
set -euo pipefail

cd "$(dirname "$0")/../packages/move/veil"

echo "Building Move package..."
sui move build --skip-fetch-latest-git-deps

echo "Publishing to testnet..."
sui client publish --gas-budget 200000000 --skip-fetch-latest-git-deps 2>&1 | tee /tmp/veil-publish.json

echo ""
echo "Set these in .env after publish:"
echo "  VITE_VEIL_PACKAGE_ID=<packageId from output>"
echo "  VITE_VEIL_REGISTRY_ID=<Registry shared object id>"
echo "  VEIL_PACKAGE_ID=<same as VITE_VEIL_PACKAGE_ID>"
