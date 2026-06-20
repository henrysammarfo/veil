# Shared Azure VM — multi-project (Nautilus / TEE)

Your friend **can** use the same `veil-enclave-vm` without touching Veil, as long as each project stays in its **own lane**.

## Rule: separate everything

| Resource | Veil (you) | Friend's project |
|----------|------------|------------------|
| **Folder** | `/home/azureuser/veil` | `/home/azureuser/<their-app>` |
| **Enclave port** | `8080` | `8081` (or `8090`) |
| **API port** | `8787` | `8788` (or `8790`) |
| **PM2 names** | `veil-enclave`, `veil-api`, `veil-keeper` | `friend-enclave`, `friend-api`, … |
| **`.env`** | `~/veil/.env` | `~/their-app/.env` — own keys |
| **On-chain** | Veil package + registry + enclave ID | Their own package + registry + enclave ID |
| **PCR / attestation** | `VEIL_PCR0/1/2` in Veil Move registry | Their own PCRs registered to **their** contract |

Nothing collides if ports, pm2 app names, and Move objects are different.

## What NOT to do

- Do **not** run `pm2 restart all` — restarts Veil too. Use `pm2 restart friend-api` only.
- Do **not** share `~/veil/.env` or Sui deployer keys unless intentional.
- Do **not** reuse Veil's ports 8080 / 8787.
- Do **not** `rm -rf ~/veil` or redeploy over `/home/azureuser/veil`.

## NSG (Azure Portal)

Add **new** inbound rules for your friend's ports (do not edit Veil rules):

| Priority | Name | Port | Source |
|----------|------|------|--------|
| 330 | friend-enclave | 8081 | Any (demo) |
| 340 | friend-api | 8788 | Any (demo) |

Veil keeps 8080 + 8787.

## Friend setup (on the VM)

```bash
cd ~
git clone <their-repo-url> their-app
cd their-app
cp .env.example .env
# fill their keys only
npm install

# their ecosystem file — example ports
export VEIL_ENCLAVE_PORT=8081
export VEIL_API_PORT=8788
export VEIL_ENCLAVE_URL=http://127.0.0.1:8081

pm2 start npm --name friend-enclave -- run enclave
pm2 start npm --name friend-api -- run api
pm2 save
```

Use a **copy** of Nautilus enclave server pattern from Mysten docs or Veil's `packages/veil-enclave` as reference — not a fork inside `~/veil`.

## Nautilus / PCR on Azure (both projects)

Each team runs their **own** EIF build:

```bash
cd ~/their-app
./scripts/azure-nitro-build.sh   # produces THEIR PCR0/1/2
```

Register **their** PCRs to **their** Move registry — Veil's on-chain enclave allowlist is unrelated.

Hardware NSM attestation (`/dev/nsm`) only exists on **AWS Nitro at runtime**. On Azure, both projects use the same pattern: **build-time PCRs + signed payloads** (see `docs/NAUTILUS-NITRO.md`).

## SSH access for friend

**Option A (safest):** Separate Linux user

```bash
sudo adduser frienddev
sudo usermod -aG azureuser frienddev   # optional read-only to shared tools
# friend works in /home/frienddev/their-app only
```

**Option B:** Same `azureuser`, strict folder + pm2 naming discipline (above).

## Quick health check (both sides)

```bash
curl http://127.0.0.1:8080/health   # Veil enclave
curl http://127.0.0.1:8787/health   # Veil API
curl http://127.0.0.1:8081/health   # friend enclave
curl http://127.0.0.1:8788/health   # friend API
```

## VM size note

`Standard B2als v2` (2 vCPU, 4 GiB) fits Veil + one friend demo. If both run heavy workloads, upgrade VM size in Portal or stop services when not demoing.
