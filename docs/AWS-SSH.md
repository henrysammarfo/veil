# Veil — AWS setup (fresh, separate from ArcPay)

Use a **new key pair** and **new EC2 instance** for Veil. Do not attach ArcPay keys or instances.

AWS Educate / student credits work the same as normal EC2 — you still pay from your student credit balance when instances run.

---

## Part 1 — AWS Console (student account)

### Step 1: Sign in
1. [AWS Console](https://console.aws.amazon.com/)
2. Confirm region top-right (e.g. **US East (N. Virginia) `us-east-1`**)
3. Stay in one region for the whole setup

### Step 2: Create Veil SSH key (new — not ArcPay)
1. **EC2** → left menu **Network & Security** → **Key pairs**
2. **Create key pair**
   - Name: **`veil-nitro-key`**
   - Key pair type: **RSA**
   - Private key format: **`.pem`**
3. **Create** → browser downloads `veil-nitro-key.pem`
4. Move file to:
   - `C:\Users\RICHEY_SON\Downloads\veil-nitro-key.pem`

> AWS shows the private key **once**. If you lose it, create a new key pair and relaunch the instance.

### Step 3: Security group for Veil
1. **EC2** → **Security Groups** → **Create security group**
2. Name: **`veil-nitro-sg`**
3. Description: `Veil Nitro enclave SSH + API`
4. VPC: default
5. **Inbound rules** → Add rules:

| Type | Port | Source | Notes |
|------|------|--------|--------|
| SSH | 22 | **My IP** | Your home IP only |
| Custom TCP | 8080 | **My IP** | Enclave HTTP (dev) |
| Custom TCP | 8787 | **My IP** | veil-api (optional) |

6. **Create security group**

### Step 4: Launch Veil EC2 (Nitro Enclaves)
1. **EC2** → **Instances** → **Launch instances**
2. Fill in:

| Field | Value |
|-------|--------|
| **Name** | `veil-nitro` |
| **AMI** | **Amazon Linux 2023** (64-bit x86) |
| **Instance type** | **`c6a.large`** or **`c6a.xlarge`** (student budget: start with `c6a.large`) |
| **Key pair** | **`veil-nitro-key`** ← not ArcPay |
| **Network / Subnet** | default |
| **Auto-assign public IP** | **Enable** |
| **Security group** | Select existing → **`veil-nitro-sg`** |
| **Storage** | **30 GiB** gp3 |

3. Expand **Advanced details** (bottom of page)
4. Check **✅ Enable Nitro Enclaves**
5. **Launch instance**
6. Wait until **Instance state** = **Running**
7. Select instance → copy **Public IPv4 DNS**  
   Example: `ec2-3-85-12-34.compute-1.amazonaws.com`

> **Student tip:** Stop the instance when not working (`Instance state` → **Stop**). You pay while it is **Running**.

---

## Part 2 — Windows SSH

```powershell
cd C:\Users\RICHEY_SON\Desktop\veil

# Copy veil-nitro-key.pem from Downloads -> .ssh + fix permissions
.\packages\veil-enclave\scripts\ssh-setup.ps1

# Set your new instance DNS (from Step 4.7)
$env:VEIL_EC2_HOST = "ec2-XX-XX-XX-XX.compute-1.amazonaws.com"

# Print exact ssh command
.\packages\veil-enclave\scripts\ssh-setup.ps1

# Connect
ssh -i "$env:USERPROFILE\.ssh\veil-nitro-key.pem" ec2-user@$env:VEIL_EC2_HOST
```

Type `yes` on first connect.

---

## Part 3 — On EC2 (first login)

```bash
# System + Nitro + Docker
sudo yum update -y
sudo yum install -y git docker nitro-enclaves-cli nitro-enclaves-allocator
sudo systemctl enable docker nitro-enclaves-allocator
sudo systemctl start docker nitro-enclaves-allocator
sudo usermod -aG docker ec2-user

# Node.js 22 (Veil requires Node >= 22)
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs
node -v   # should be v22.x

# Log out so docker group applies
exit
```

SSH in again:

```bash
# Clone Veil (or scp from your machine)
git clone <repo-url>
cd veil
npm install --legacy-peer-deps

# Server .env — your Enoki, MemWal, SUI keys (never commit)
cp .env.example .env
nano .env
```

Minimum server `.env`:

```env
MEMWAL_DELEGATE_KEY=...
MEMWAL_ACCOUNT_ID=...
ENOKI_SECRET_KEY=...
SUI_PRIVATE_KEY=...
PREDICT_MANAGER_ID=...
PREDICT_ORACLE_ID=...
VEIL_ENCLAVE_PORT=8080
```

Deploy Nitro enclave:

```bash
sh packages/veil-enclave/scripts/aws-nitro-deploy.sh
```

Run API (second terminal / `screen`):

```bash
npm run api
```

Health check from your laptop:

```powershell
curl http://<EC2_PUBLIC_IP>:8080/health
curl http://<EC2_PUBLIC_IP>:8787/health
```

---

## Part 4 — Local Windows `.env` points at AWS

```env
VEIL_ENCLAVE_URL=http://<EC2_PUBLIC_IP>:8080
VITE_VEIL_ENCLAVE_URL=http://<EC2_PUBLIC_IP>:8080
VITE_VEIL_API_URL=http://<EC2_PUBLIC_IP>:8787
```

Run frontend locally:

```powershell
npm run dev
```

---

## Part 5 — Register enclave on Sui (after Move publish)

On EC2:

```bash
export VEIL_PACKAGE_ID=0x...
export VEIL_REGISTRY_ID=0x...
export ENCLAVE_URL=http://127.0.0.1:8080
sh packages/veil-enclave/scripts/register-enclave.sh
```

---

## What NOT to use for Veil

| Do not use | Use instead |
|------------|-------------|
| `arcpay-proof-linux_key.pem` | `veil-nitro-key.pem` |
| ArcPay EC2 instance | New instance `veil-nitro` |
| Oracle `ssh-key-2026-03-21.key` | AWS `.pem` only |
| Instance without **Enable Nitro Enclaves** | Relaunch with checkbox on |

---

## Student budget checklist

| Action | Saves money |
|--------|-------------|
| **Stop** instance when done for the day | Yes |
| Use `c6a.large` for dev, scale up for demo | Yes |
| Delete old test EBS snapshots you do not need | Yes |
| One Veil instance only | Yes |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Permission denied (publickey)` | Wrong `.pem` — must be `veil-nitro-key` matching instance Key pair name |
| `nitro-cli: command not found` | `sudo yum install nitro-enclaves-cli nitro-enclaves-allocator` |
| Cannot enable Nitro after launch | Terminate instance → relaunch with **Enable Nitro Enclaves** checked |
| Port 8080 timeout | Security group → allow 8080 from **My IP** |
| Student account service limit | Request limit increase for `c6a` instances in Service Quotas |

---

## Quick checklist

- [ ] Created key pair **`veil-nitro-key`** (not ArcPay)
- [ ] Saved `veil-nitro-key.pem` to Downloads
- [ ] Created security group **`veil-nitro-sg`**
- [ ] Launched **`veil-nitro`** with **Nitro Enclaves enabled**
- [ ] SSH works with `veil-nitro-key.pem`
- [ ] `aws-nitro-deploy.sh` completed
- [ ] `.env` on server with MemWal + Enoki + SUI
- [ ] Local `.env` points at EC2 IP
