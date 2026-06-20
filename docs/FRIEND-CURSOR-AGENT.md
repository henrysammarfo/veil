# Shared Azure VM — Cursor agent setup guide

**Audience:** Cursor agent setting up a **second project** on the same VM as Veil.  
**Goal:** Run this team's Nautilus-compatible enclave + API **without modifying or stopping Veil**.

---

## Hard constraints (never violate)

| Rule | Detail |
|------|--------|
| **Do not touch Veil** | Never read, edit, delete, or redeploy `/home/azureuser/veil` |
| **Do not use Veil ports** | `8080` (enclave) and `8787` (api) are reserved for Veil |
| **Do not use Veil PM2 names** | Never `pm2 restart all`, `pm2 delete`, or restart `veil-enclave`, `veil-api`, `veil-keeper` |
| **Separate everything** | Own repo folder, own `.env`, own Sui keys, own Move package, own enclave PCR registration |
| **No shared secrets** | Do not copy `/home/azureuser/veil/.env` |

Veil health (must stay up after your work):

```bash
curl -sf http://127.0.0.1:8080/health
curl -sf http://127.0.0.1:8787/health
```

---

## VM facts

| Field | Value |
|-------|--------|
| VM name | `veil-enclave-vm` |
| Resource group | `veil-rg` |
| Public IP | `51.103.219.168` |
| SSH user | `azureuser` |
| OS | Ubuntu 24.04 |
| Region | Switzerland North |

SSH key path is **local to the developer** (Windows example):

```text
C:\Users\<USER>\.ssh\<key-name>.pem
```

---

## Port allocation

Assign **this project** these ports (change if 8081/8788 taken):

| Service | Port | Env var |
|---------|------|---------|
| Enclave HTTP | **8081** | `VEIL_ENCLAVE_PORT=8081` |
| API gateway | **8788** | `VEIL_API_PORT=8788` |
| Enclave URL (internal) | — | `VEIL_ENCLAVE_URL=http://127.0.0.1:8081` |

Before binding, verify ports are free:

```bash
ss -tlnp | grep -E '8081|8788' || echo "ports free"
```

If taken, use `8090` / `8790` instead and update NSG rules accordingly.

---

## Agent workflow

### 1. SSH and create isolated workspace

```bash
ssh -i <SSH_KEY.pem> azureuser@51.103.219.168

cd ~
git clone <THEIR_REPO_URL> <their-app>
cd <their-app>
```

Folder **must not** be `~/veil`. Example: `~/acme-app`.

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
cp .env.example .env
```

Fill `.env` with **this project's keys only**. Minimum server block:

```env
VEIL_ENCLAVE_PORT=8081
VEIL_API_PORT=8788
VEIL_ENCLAVE_URL=http://127.0.0.1:8081
VEIL_ENCLAVE_HOST=0.0.0.0

SUI_PRIVATE_KEY=<their deployer key>
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

Frontend (if any):

```env
VITE_<PREFIX>_API_URL=http://51.103.219.168:8788
VITE_<PREFIX>_ENCLAVE_URL=http://51.103.219.168:8081
```

### 3. Fix import paths (monorepo)

From `services/*/src/`, imports to `packages/` need **three** levels up:

```typescript
// WRONG — resolves to services/packages/...
await import("../../packages/sdk/src/foo.ts");

// CORRECT
await import("../../../packages/sdk/src/foo.ts");
```

Verify API starts without `ERR_MODULE_NOT_FOUND` before PM2.

### 4. Start with PM2 (unique names)

Replace `<prefix>` with project slug (e.g. `acme`):

```bash
cd ~/<their-app>

pm2 start npm --name <prefix>-enclave -- run enclave
pm2 start npm --name <prefix>-api -- run api
pm2 save
pm2 status
```

**Only restart own apps:** `pm2 restart <prefix>-api`

### 5. Local health check (on VM)

```bash
curl -sf http://127.0.0.1:8081/health && echo " enclave OK"
curl -sf http://127.0.0.1:8788/health && echo " api OK"
```

### 6. Azure NSG (portal — owner adds rules)

New inbound rules on `veil-enclave-vm-nsg` only:

| Priority | Name | Port | Source |
|----------|------|------|--------|
| 330 | `<prefix>-enclave` | 8081 | Any |
| 340 | `<prefix>-api` | 8788 | Any |

Do **not** edit Veil rules for 8080 / 8787.

### 7. Public health check

```powershell
Invoke-WebRequest http://51.103.219.168:8081/health -UseBasicParsing
Invoke-WebRequest http://51.103.219.168:8788/health -UseBasicParsing
```

---

## Nautilus / TEE (this project only)

- Build **own** enclave image and PCRs (`PCR0`, `PCR1`, `PCR2`).
- Register against **own** Move registry — not Veil's contracts.
- Azure path: Nautilus-compatible HTTP server + build-time PCRs.
- Reference: https://github.com/MystenLabs/nautilus

---

## PM2 — safe vs unsafe

| Safe | Unsafe |
|------|--------|
| `pm2 status` | `pm2 restart all` |
| `pm2 logs <prefix>-api` | `pm2 delete veil-api` |
| `pm2 restart <prefix>-enclave` | `rm -rf ~/veil` |

---

## Verification checklist

- [ ] Project in `~/<their-app>`, not `~/veil`
- [ ] Ports 8081 / 8788 (or documented alternates)
- [ ] PM2 names `<prefix>-*`, not `veil-*`
- [ ] Health OK on 8081 and 8788
- [ ] Veil still OK on 8080 and 8787
- [ ] NSG rules for new ports only
- [ ] No Veil files modified

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API crash `ERR_MODULE_NOT_FOUND` … `services/packages/` | Use `../../../packages/` in imports |
| `EADDRINUSE` | Use 8090/8790 |
| SSH timeout | Owner refreshes NSG My IP on port 22 |
| Veil broken after mistake | Owner: `cd ~/veil && pm2 restart veil-enclave veil-api veil-keeper` |

---

## Human provides privately

- SSH `.pem` key
- Repo URL + `.env` secrets
- NSG approval in Azure Portal
