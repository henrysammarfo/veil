# Veil — Intelligent Stealth Execution for DeepBook Predict

**Trade smarter. Stay invisible.**

Sui Overflow 2026 · DeepBook track · Nautilus TEE + DeepBook Predict + Walrus MemWal

## Architecture

```
TanStack Start (frontend)
    → veil-api (:8787)
        → veil-enclave (:8080) — Nautilus-compatible TEE server
        → predict-server.testnet.mystenlabs.com
    → keeper service (Earn mode)
    → Sui Move (packages/move/veil)
    → MemWal staging relayer
```

## Monorepo

| Path | Purpose |
|------|---------|
| `packages/move/veil` | Move: registry, attestation, execution_proof, parlay, events |
| `packages/execution-engine` | SVI, Kelly, TWAP, 4 mode executors |
| `packages/sdk` | Predict PTB builders + PredictServerClient + VeilClient |
| `packages/walrus-reporter` | MemWal provenance adapter |
| `packages/veil-enclave` | TEE HTTP server + Nitro Dockerfile |
| `services/veil-api` | API gateway |
| `services/keeper` | Earn mode keeper |

## Quick start

```bash
npm install --legacy-peer-deps
cp .env.example .env
# Fill .env locally — never commit secrets
```

```bash
npm run enclave   # terminal 1
npm run api       # terminal 2
npm run dev       # terminal 3
npm run keeper    # terminal 4 (optional)
```

## Move contracts

```bash
npm run move:build
# publish with sui client publish — set IDs in local .env
```

Modules: `veil::registry`, `veil::attestation`, `veil::execution_proof`, `veil::parlay`, `veil::events`

## Deploy branches

| Branch | Purpose | Build |
|--------|---------|-------|
| `main` | Full app + judge/local testing | `npm run build` |
| `deploy/waitlist` | Public site — waitlist only | `npm run build:waitlist` |

Public waitlist env template: `env/waitlist.public.example` → run `scripts/prepare-waitlist-branch.ps1 -VmIp YOUR_VM_IP` → `npm run build:waitlist`.

Public waitlist: `npm run dev:waitlist` → http://localhost:5173  
Judge / full dashboard: `npm run dev:judge` → http://localhost:5174 (after `scripts/prepare-judge-env.ps1`)

Judges: [docs/JUDGES.md](docs/JUDGES.md) · Deploy: [docs/DEPLOY.md](docs/DEPLOY.md) · Demo shots: [docs/DEMO-SHOTLIST.md](docs/DEMO-SHOTLIST.md)

## Cloud deploy

Azure VM setup: [docs/AZURE-SSH.md](docs/AZURE-SSH.md). Sharing the VM with another Nautilus project: [docs/SHARED-VM.md](docs/SHARED-VM.md).

```powershell
$env:VEIL_EC2_HOST = "YOUR_VM_IP"
.\scripts\azure-drop-env.ps1 -VmIp $env:VEIL_EC2_HOST
```

Use your local `.env` for secrets; the script uploads it to the VM only.

## Testing

```bash
npm run test
npm run test:engine
npm run move:test
npm run smoke         # requires enclave + api
npm run ci
```

## DeepBook Predict testnet

| Parameter | Value |
|-----------|-------|
| Branch | `predict-testnet-4-16` |
| Server | https://predict-server.testnet.mystenlabs.com |
| dUSDC faucet | https://tally.so/r/Xx102L |

PTB builders: `packages/sdk/src/predict-ptb.ts`. Live mints need local `SUI_PRIVATE_KEY` and Predict object IDs in `.env`.

## Environment variables

Copy `.env.example`. All secrets stay in local `.env` or your host's secret store — **never commit keys, VM IPs, or judge codes**.

| Variable | Purpose |
|----------|---------|
| `VITE_ENOKI_PUBLIC_KEY` | zkLogin (frontend) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth |
| `ENOKI_SECRET_KEY` | Sponsored txs (backend only) |
| `SUI_PRIVATE_KEY` | Move publish, keeper, PTBs |
| `PREDICT_MANAGER_ID` / `PREDICT_ORACLE_ID` | Predict testnet objects |

## Security

See [SECURITY.md](SECURITY.md). TEE template is not audited — do not claim unhackable execution.
