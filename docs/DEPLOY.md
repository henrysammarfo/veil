# Deploy (public-safe)

## Public waitlist site

Branch: `deploy/waitlist`

```powershell
$env:VEIL_EC2_HOST = "YOUR_VM_IP"
.\scripts\prepare-waitlist-branch.ps1 -VmIp $env:VEIL_EC2_HOST
npm run build:waitlist
# Deploy dist/ to static host — no judge code in this build
```

## Full dashboard (judges / staging)

```powershell
$env:VEIL_EC2_HOST = "YOUR_VM_IP"
.\scripts\prepare-production-env.ps1 -VmIp $env:VEIL_EC2_HOST
# Set VITE_JUDGE_ACCESS_CODE in local .env only — never commit
npm run build:production
```

## Azure backend (.env on VM)

```powershell
# Local .env must exist with secrets — never committed
$env:VEIL_EC2_HOST = "YOUR_VM_IP"
.\scripts\azure-drop-env.ps1 -VmIp $env:VEIL_EC2_HOST
```

If SSH times out: Azure Portal → VM → **Run command** → paste `packages/veil-enclave/scripts/azure-portal-runcommand.sh`, or refresh NSG **My IP** on port 22.

## What stays private

- `.env`, `.env.waitlist`, `.env.production`
- Judge access codes (DeepSurge submission notes only)
- `docs/SUBMISSION.md`, `docs/DEMO.md` (gitignored internal notes)
