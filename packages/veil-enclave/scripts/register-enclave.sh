#!/usr/bin/env bash
# Register Veil enclave attestation on Sui testnet (after AWS Nitro deploy)
set -euo pipefail

ENCLAVE_URL="${ENCLAVE_URL:-http://localhost:8080}"
VEIL_PACKAGE_ID="${VEIL_PACKAGE_ID:?set VEIL_PACKAGE_ID}"
REGISTRY_ID="${VEIL_REGISTRY_ID:?set VEIL_REGISTRY_ID}"

echo "Fetching attestation from ${ENCLAVE_URL}..."
ATT=$(curl -s "${ENCLAVE_URL}/get_attestation")
echo "${ATT}" | tee /tmp/veil-attestation.json

PCR0=$(echo "${ATT}" | jq -r '.pcr0')
PCR1=$(echo "${ATT}" | jq -r '.pcr1')
PCR2=$(echo "${ATT}" | jq -r '.pcr2')
PUBKEY=$(echo "${ATT}" | jq -r '.publicKey')
ENCLAVE_ID=$(echo "${ATT}" | jq -r '.enclaveId')

echo ""
echo "Register enclave on-chain:"
echo "  Package:  ${VEIL_PACKAGE_ID}"
echo "  Registry: ${REGISTRY_ID}"
echo "  Enclave:  ${ENCLAVE_ID}"
echo ""
echo "sui client ptb \\"
echo "  --move-call ${VEIL_PACKAGE_ID}::registry::register_enclave \\"
echo "    @${REGISTRY_ID} \\"
echo "    @<AdminCap> \\"
echo "    \"${ENCLAVE_ID}\" \\"
echo "    \"${PCR0}\" \"${PCR1}\" \"${PCR2}\" \\"
echo "    \"${PUBKEY}\" \\"
echo "    \"veil-nitro-prod\""
