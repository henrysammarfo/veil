# Security posture

Veil targets **verifiable execution** (TEE attestation + on-chain `ExecutionProof`), not unaudited "unhackable" claims.

## Known limitations

- Nautilus reproducible build template: **not security-audited**
- Veil Move contracts: hackathon scope — no third-party audit pre-submission
- MemWal: beta staging environment
- Testnet package IDs may rotate before mainnet

## Mitigations

- Move: access control on registry; enclave registration before `record_execution`
- Execution engine: Kelly cap, oracle freshness check, slice jitter
- Secrets: `.env` gitignored; Enoki private key server-only
- CI: `npm run ci`

## Report vulnerabilities

Open a **GitHub Security Advisory** on this repository (post-submission). Do not paste keys or `.env` contents in public issues.
