# Veil — Microsoft Azure (student account)

**Azure is not AWS.** There is no Nitro Enclaves on Azure. Do **not** run `aws-nitro-deploy.sh` on Azure.

For Veil on **Azure for Students**, you host the **Nautilus-compatible enclave HTTP server** on a Linux VM — same as local `npm run enclave`, reachable from the internet for your demo.

| Platform | What you run |
|----------|----------------|
| **Azure VM** (this guide) | `npm run enclave` + `npm run api` |
| **AWS EC2 + Nitro** (optional later) | `aws-nitro-deploy.sh` + hardware attestation |

ArcPay resources stay separate. Create a **new** resource group and VM for Veil.

---

## Part 1 — Azure Portal (student account)

### 1. Sign in
1. [https://portal.azure.com](https://portal.azure.com) (or Azure for Students portal)
2. Confirm subscription shows **student credits**

### 2. Resource group
1. **Resource groups** → **Create**
2. Name: **`veil-rg`**
3. Region: pick one close to you (e.g. **East US**)
4. **Review + create**

### 3. SSH key (new for Veil — not ArcPay)
**Option A — Azure generates key (easiest on Windows):**
1. When creating the VM (step 4), under **Administrator account**:
   - Authentication type: **SSH public key**
   - Username: **`azureuser`**
   - Key pair name: **`veil-azure-key`**
2. Azure downloads **`veil-azure-key.pem`** once — save to:
   - `C:\Users\RICHEY_SON\Downloads\veil-azure-key.pem`

**Option B — use your own public key:**
```powershell
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\veil-azure-key" -N '""'
# Paste contents of veil-azure-key.pub into Azure portal when creating VM
```

### 4. Create virtual machine
1. **Virtual machines** → **Create** → **Azure virtual machine**
2. Settings:

| Field | Value |
|-------|--------|
| **Resource group** | `veil-rg` |
| **VM name** | `veil-enclave-vm` |
| **Region** | same as resource group |
| **Image** | **Ubuntu Server 22.04 LTS** (x64) |
| **Size** | **Standard_B2s** (cheap, OK for dev) or **Standard_D2s_v3** for demo |
| **Authentication** | SSH public key → **`veil-azure-key`** |
| **Username** | `azureuser` |
| **Public inbound ports** | **Allow selected ports** → SSH (22) |

3. **Networking** tab → **NIC network security group** → **Advanced**

**If SSH times out:** NSG inbound rules are IP-locked. Your portal showed `154.161.26.51/32` but your IP can change (e.g. to `154.161.148.x`). For hackathon demo, set source to **Any** (`0.0.0.0/0`) on ports **22**, **8080**, **8787** — then restrict again after DeepSurge if you want.

**Nitro PCR without AWS:** on the VM run `./scripts/azure-nitro-build.sh` (see [NAUTILUS-NITRO.md](./NAUTILUS-NITRO.md)).

4. Add inbound security rules:

| Priority | Name | Port | Source |
|----------|------|------|--------|
| 100 | SSH | 22 | **My IP address** |
| 110 | veil-enclave | 8080 | **My IP address** |
| 120 | veil-api | 8787 | **My IP address** |

5. **Review + create** → **Create**
6. Wait for deployment → copy **Public IP address** (e.g. `20.x.x.x`)

> **Save money:** **Stop** the VM when not working (Portal → VM → **Stop**). You pay while **Running**.

---

## Part 2 — SSH from Windows

```powershell
cd C:\Users\RICHEY_SON\Desktop\veil

# Default key name for Azure Veil VM
$env:VEIL_SSH_KEY = "veil-azure-key.pem"
$env:VEIL_EC2_USER = "azureuser"   # script reuses this var for SSH user
$env:VEIL_EC2_HOST = "20.x.x.x"    # your Azure public IP

.\packages\veil-enclave\scripts\ssh-setup.ps1

ssh -i "$env:USERPROFILE\.ssh\veil-azure-key.pem" azureuser@$env:VEIL_EC2_HOST
```

First time: type `yes` to trust host.

---

## Part 3 — On the Azure VM

```bash
# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential

node -v   # v22.x

# Clone Veil
git clone <repo-url>
cd veil
npm install --legacy-peer-deps

# Secrets — never commit
cp .env.example .env
nano .env
```

Required in server `.env`:

```env
MEMWAL_DELEGATE_KEY=...
MEMWAL_ACCOUNT_ID=...
ENOKI_SECRET_KEY=...
SUI_PRIVATE_KEY=...
PREDICT_MANAGER_ID=...
PREDICT_ORACLE_ID=...
VEIL_ENCLAVE_PORT=8080
VEIL_API_PORT=8787
```

Deploy (Azure path — **not** Nitro):

```bash
sh packages/veil-enclave/scripts/azure-vm-deploy.sh
```

Run services (use two SSH sessions or `tmux`):

```bash
# Terminal 1
npm run enclave

# Terminal 2
npm run api
```

Optional — keep running after logout:

```bash
sudo npm install -g pm2
pm2 start npm --name veil-enclave -- run enclave
pm2 start npm --name veil-api -- run api
pm2 save
pm2 startup
```

Health from your laptop:

```powershell
curl http://<AZURE_PUBLIC_IP>:8080/health
curl http://<AZURE_PUBLIC_IP>:8787/health
```

---

## Part 4 — Windows `.env` (point frontend at Azure)

```env
VEIL_ENCLAVE_URL=http://<AZURE_PUBLIC_IP>:8080
VITE_VEIL_ENCLAVE_URL=http://<AZURE_PUBLIC_IP>:8080
VITE_VEIL_API_URL=http://<AZURE_PUBLIC_IP>:8787
```

```powershell
npm run dev
```

---

## Part 5 — Register on Sui testnet

After Move publish, on the VM:

```bash
export VEIL_PACKAGE_ID=0x...
export VEIL_REGISTRY_ID=0x...
export ENCLAVE_URL=http://127.0.0.1:8080
sh packages/veil-enclave/scripts/register-enclave.sh
```

---

## Azure vs AWS (honest)

| | Azure VM (student) | AWS Nitro |
|--|-------------------|-----------|
| Works with your credits | ✅ | separate AWS account |
| `npm run enclave` | ✅ | ✅ (inside Nitro with extra setup) |
| `aws-nitro-deploy.sh` | ❌ | ✅ |
| Hardware TEE attestation | software only (no `/dev/nsm`) | **Real Nitro PCR** via `Dockerfile.nitro` + `aws-nitro-deploy.sh` |
| `/get_attestation` | 503 unless `VEIL_PCR0/1/2` set manually | live NSM document + on-chain `register_enclave_nitro` |
| Good for hackathon demo | ✅ | ✅ (stronger TEE story) |

For **Sui Overflow / DeepSurge**, an Azure VM running the live enclave + API + testnet txs is a valid demo. Mention in README that production TEE target is Nautilus on AWS Nitro; Azure hosts your testnet deployment.

---

## Do not use for Veil

| Wrong | Right |
|-------|--------|
| ArcPay AWS keys / instances | New **`veil-azure-key`** + **`veil-enclave-vm`** |
| Oracle `ssh-key-2026-03-21.key` | Azure `.pem` or `veil-azure-key` |
| `aws-nitro-deploy.sh` on Azure | `azure-vm-deploy.sh` + `npm run enclave` |
| `arcpay-proof-linux_key.pem` | `veil-azure-key.pem` |

---

## Checklist

- [ ] Resource group **`veil-rg`**
- [ ] VM **`veil-enclave-vm`** Ubuntu 22.04
- [ ] NSG: ports **22, 8080, 8787** from your IP
- [ ] **`veil-azure-key.pem`** in Downloads + `.ssh`
- [ ] SSH works as `azureuser@<public-ip>`
- [ ] `.env` on VM with MemWal + Enoki + SUI
- [ ] `curl :8080/health` and `:8787/health` OK
- [ ] Local `.env` points at Azure IP
- [ ] **Stop VM** when done to save student credits
