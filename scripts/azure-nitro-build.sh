#!/usr/bin/env bash
# Build Veil Nitro EIF on Azure (or any Linux VM with Docker) — NO AWS account needed.
# nitro-cli build-enclave computes real PCR0/1/2 for the image (same values AWS Nitro would use).
# Runtime stays on Azure (software enclave); PCRs come from reproducible EIF build.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IMAGE="${VEIL_ENCLAVE_IMAGE:-veil-enclave:nitro}"
EIF="${VEIL_EIF_PATH:-$ROOT/veil-enclave.eif}"
PCR_FILE="${VEIL_PCR_FILE:-$ROOT/veil-nitro.pcrs.json}"

echo "==> Building Docker image ${IMAGE} ..."
docker build -f packages/veil-enclave/Dockerfile.nitro -t "${IMAGE}" .

echo "==> Building Nitro EIF + PCR measurements (Amazon Linux container) ..."
docker run --rm --privileged \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$ROOT:/work" \
  -w /work \
  amazonlinux:2023 \
  bash -c '
    set -euo pipefail
    dnf install -y aws-nitro-enclaves-cli aws-nitro-enclaves-cli-devel
    test -f /usr/share/nitro_enclaves/blobs/cmdline || ls -la /usr/share/nitro_enclaves/blobs/ || true
    nitro-cli build-enclave \
      --docker-uri '"${IMAGE}"' \
      --output-file /work/veil-enclave.eif 2>&1 | tee /work/nitro-build.log
    if [ -f /work/veil-enclave.eif ]; then
      nitro-cli describe-eif --eif-path /work/veil-enclave.eif > /work/veil-nitro.pcrs.json 2>/dev/null || true
    fi
  '

if [ ! -f "$EIF" ]; then
  echo "EIF build failed — check nitro-build.log"
  exit 1
fi

echo "==> Extracting PCR0/1/2 ..."
node scripts/extract-pcrs.mjs

echo ""
echo "Done. Restart enclave: pm2 restart veil-enclave || npm run enclave"
echo "Verify: curl http://127.0.0.1:8080/get_attestation"
echo "Register: npm run register:enclave"
