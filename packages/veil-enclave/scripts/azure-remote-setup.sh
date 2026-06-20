#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

if ! command -v node >/dev/null 2>&1; then
  NEED_NODE=1
else
  NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
  [ "$NODE_MAJOR" -lt 22 ] && NEED_NODE=1 || NEED_NODE=0
fi

if [ "${NEED_NODE:-1}" -eq 1 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs git
fi
echo "Node: $(node -v)"

mkdir -p ~/veil
tar -xzf ~/veil-deploy.tgz -C ~/veil
cd ~/veil

mkdir -p data

if [ ! -f .env ]; then
  cat > .env << 'ENVEOF'
# Veil Azure bootstrap — copy real keys from local .env (live-only, no mocks)
VEIL_ENCLAVE_URL=http://127.0.0.1:8080
VEIL_ENCLAVE_PORT=8080
VEIL_API_PORT=8787
VEIL_STORE_PATH=/home/azureuser/veil/data/veil-store.json
VITE_SUI_NETWORK=testnet
ENVEOF
else
  echo "Keeping existing ~/veil/.env (run azure-drop-env.ps1 from Windows to refresh secrets)"
fi

echo "npm install..."
npm install --legacy-peer-deps

sudo npm install -g pm2
pm2 delete veil-enclave veil-api veil-keeper 2>/dev/null || true
pm2 start packages/veil-enclave/ecosystem.azure.config.cjs
pm2 save

STARTUP=$(sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u azureuser --hp /home/azureuser | grep sudo | tail -1)
eval "$STARTUP" || true

sleep 4
pm2 status
curl -sf http://127.0.0.1:8080/health && echo "enclave OK" || echo "enclave FAIL"
curl -sf http://127.0.0.1:8787/health && echo "api OK" || echo "api FAIL"
