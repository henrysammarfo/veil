# Nautilus PCR on Azure (no AWS account)

Veil uses **Azure for runtime** and **Nitro EIF build for real PCR measurements** — you do not need a running AWS EC2.

## How it works

| Step | Where | What |
|------|--------|------|
| Build EIF | Azure VM (Docker) | `nitro-cli build-enclave` computes **real** PCR0/1/2 for your image |
| Run enclave | Azure VM | `npm run enclave` — Ed25519 signing + registered PCRs |
| Register | Your laptop | `npm run register:enclave` with `VEIL_PCR0/1/2` from build |

Nautilus docs: users verify code by matching **reproducible build PCRs** to on-chain registry. Full NSM attestation (`/dev/nsm`) only exists inside a *running* AWS Nitro enclave; for hackathon demo, **build-time PCRs + enclave signatures** is the standard Azure path.

## On Azure VM (after SSH works)

```bash
cd ~/veil
chmod +x scripts/azure-nitro-build.sh
./scripts/azure-nitro-build.sh
pm2 restart all
curl http://127.0.0.1:8080/get_attestation
```

Then from your machine:

```powershell
npm run register:enclave
```

## NSG — use Any for demo

Your IP changes (was `154.161.26.51` in portal, now different). For hackathon:

- Set inbound **22, 8080, 8787** source to **Any** (`0.0.0.0/0`) on `veil-enclave-vm-nsg`
- Rotate secrets after demo; restrict IP again later if you want

## Sui CLI (no admin)

Project-local install — no Chocolatey admin:

```powershell
npm run install:sui-cli
npm run upgrade:move
```

Installs to `tools/sui-1.73/` only.
