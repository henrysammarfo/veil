#!/usr/bin/env bash
# Veil enclave + API on a standard Linux VM (Azure, VPS, etc.)
# NOT AWS Nitro — use aws-nitro-deploy.sh only on AWS EC2 with Nitro Enclaves.
set -euo pipefail

cd "$(dirname "$0")/../../.."

echo "Installing Node dependencies..."
npm install --legacy-peer-deps

if ! command -v node >/dev/null; then
  echo "Node.js 22+ required. On Ubuntu:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Node $(node -v) found — Veil requires Node 22+"
  exit 1
fi

if [ ! -f .env ]; then
  echo "Copy .env.example to .env and set MEMWAL_*, ENOKI_SECRET_KEY, SUI_PRIVATE_KEY"
  cp -n .env.example .env || true
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env 2>/dev/null || true
set +a

echo ""
echo "Start in two terminals (or use pm2/systemd):"
echo "  npm run enclave   # :8080"
echo "  npm run api       # :8787"
echo ""
echo "Health:"
echo "  curl http://127.0.0.1:8080/health"
echo "  curl http://127.0.0.1:8787/health"
