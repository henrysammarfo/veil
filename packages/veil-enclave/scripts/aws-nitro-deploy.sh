#!/usr/bin/env bash
# AWS Nitro Enclave deployment for Veil (Nautilus-compatible host flow)
set -euo pipefail

IMAGE="${VEIL_ENCLAVE_IMAGE:-veil-enclave:latest}"
ENCLAVE_CID="${ENCLAVE_CID:-16}"
CPU="${ENCLAVE_CPU:-2}"
MEMORY="${ENCLAVE_MEMORY:-4096}"

echo "Building Docker image ${IMAGE} (Nitro)..."
docker build -f packages/veil-enclave/Dockerfile.nitro -t "${IMAGE}" .

echo "Building Nitro enclave EIF..."
nitro-cli build-enclave --docker-uri "${IMAGE}" --output-file veil-enclave.eif

echo "Running enclave CID=${ENCLAVE_CID}..."
nitro-cli run-enclave \
  --eif-path veil-enclave.eif \
  --cpu-count "${CPU}" \
  --memory "${MEMORY}" \
  --enclave-cid "${ENCLAVE_CID}"

echo "Register on Sui testnet:"
echo "  sh packages/veil-enclave/scripts/register-enclave.sh"
