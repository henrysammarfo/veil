#!/bin/bash
set -euo pipefail
cd /app
exec npx tsx packages/veil-enclave/src/main.ts
