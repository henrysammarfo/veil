#!/bin/bash
# Paste into Azure Portal: veil-enclave-vm -> Run command -> RunShellScript
# Uses ~/veil-deploy.tgz already uploaded (or clones fresh if missing)
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
export HOME=/home/azureuser

log() { echo "[veil-setup] $*"; }

log "Installing Node 22..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -p "process.versions.node.split('.')[0]")" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs git
fi
log "Node $(node -v)"

log "Deploying Veil..."
mkdir -p /home/azureuser/veil /home/azureuser/data
cd /home/azureuser

if [ -f veil-deploy.tgz ]; then
  tar -xzf veil-deploy.tgz -C veil
else
  log "No tarball — cloning from GitHub..."
  rm -rf veil
  git clone "${VEIL_REPO_URL:-<set-VEIL_REPO_URL>}" veil || true
fi

cd /home/azureuser/veil

cat > .env << 'EOF'
VEIL_ENCLAVE_URL=http://127.0.0.1:8080
VEIL_ENCLAVE_PORT=8080
VEIL_API_PORT=8787
VEIL_STORE_PATH=/home/azureuser/veil/data/veil-store.json
VITE_SUI_NETWORK=testnet
EOF

mkdir -p data
log "npm install (3-5 min)..."
npm install --legacy-peer-deps

log "Starting pm2..."
npm install -g pm2
pm2 delete veil-enclave veil-api 2>/dev/null || true
pm2 start npm --name veil-enclave -- run enclave
pm2 start npm --name veil-api -- run api
pm2 save
pm2 startup systemd -u azureuser --hp /home/azureuser | tail -1 | bash || true

sleep 4
pm2 status
curl -sf http://127.0.0.1:8080/health && log "ENCLAVE OK" || log "ENCLAVE FAIL"
curl -sf http://127.0.0.1:8787/health && log "API OK" || log "API FAIL"
log "DONE — open ports 8080/8787 from your IP in NSG, then test public health"
