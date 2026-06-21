# Deploy — two Vercel projects

**Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) · **Demo script:** [DEMO-SCRIPT.md](./DEMO-SCRIPT.md)

| Project | Git branch | Local dev | Build | DeepSurge? |
|---------|------------|-----------|-------|------------|
| **Public waitlist** | `deploy/waitlist` | `npm run dev:waitlist` → :5173 | `npm run build:waitlist` | No |
| **Reviewer app** | `main` | `npm run dev:judge` → :5174 | `npm run build:production` | **Yes — submit this URL** |

Both branches share the same codebase. Only Vercel env vars differ (`VITE_WAITLIST_ONLY`, `VITE_REVIEWER_APP_URL`).

Judges open the **reviewer app**, click Begin Journey, sign in. **No access code.**

---

## Git branches

| Branch | Purpose |
|--------|---------|
| `main` | Source of truth · reviewer / judge Vercel deploy |
| `deploy/waitlist` | Public waitlist Vercel deploy (synced with `main`) |

After merging features into `main`, fast-forward `deploy/waitlist`:

```powershell
git checkout deploy/waitlist
git merge main
git push origin main deploy/waitlist
```

---

## 1. Public waitlist (Vercel project A)

```powershell
$env:VEIL_EC2_HOST = "YOUR_VM_IP"
.\scripts\prepare-waitlist-branch.ps1 -VmIp $env:VEIL_EC2_HOST
```

Set in `.env.waitlist` (or Vercel env vars):

- `VITE_WAITLIST_ONLY=true`
- `VITE_REVIEWER_APP_URL=https://your-reviewer-app.vercel.app` — so `/auth` on the public site tells lost judges where to go

```powershell
npm run build:waitlist
# Deploy dist/ to Vercel project A
```

---

## 2. Reviewer app (Vercel project B — DeepSurge link)

```powershell
$env:VEIL_EC2_HOST = "YOUR_VM_IP"
.\scripts\prepare-production-env.ps1 -VmIp $env:VEIL_EC2_HOST
```

Must have:

- `VITE_WAITLIST_ONLY=false`
- `VITE_ENOKI_PUBLIC_KEY`, `VITE_GOOGLE_CLIENT_ID` (for zkLogin)
- `VITE_VEIL_API_URL`, `VITE_VEIL_ENCLAVE_URL` → your Azure VM
- `VITE_VEIL_PACKAGE_ID`, `VITE_VEIL_REGISTRY_ID`

```powershell
npm run build:production
# Deploy dist/ to Vercel project B — paste this URL in DeepSurge
```

**Vercel build settings (reviewer project):**

- Build command: `npm run build:production`
- Output: `dist` (or your TanStack Start output dir)
- Env: copy from `.env.production`

---

## Azure backend

```powershell
$env:VEIL_EC2_HOST = "YOUR_VM_IP"
.\scripts\azure-drop-env.ps1 -VmIp $env:VEIL_EC2_HOST
```

Both frontends can share the same VM API/enclave URLs.

---

## What stays private

- `.env`, `.env.waitlist`, `.env.production`, `.env.judge`
- Backend secrets (`ENOKI_SECRET_KEY`, `SUI_PRIVATE_KEY`, etc.)

## Pre-flight before submission

On **reviewer URL** only:

1. `/` loads landing
2. **BEGIN JOURNEY** → `/auth` → wallet or Google works
3. `/dashboard` loads after sign-in
4. Place one BULL order; check Proofs tab
5. `/attest/{hash}` works from a proof hash

On **waitlist URL**:

1. **JOIN WAITLIST** everywhere (no “dashboard” CTAs)
2. `/dashboard` redirects to `/waitlist`
3. `/auth` shows “waitlist only” + link to reviewer app

---

## Vercel deploy (pick one)

### Option A — GitHub (recommended)

`veil-reviewer` is already linked to `github.com/henrysammarfo/veil` on team **teamtitanlink**.

1. Open [vercel.com](https://vercel.com) → **veil-reviewer**
2. **Settings → Git** → Production Branch = `main`
3. **Settings → General** → Build Command = `npm run build:production`, Install = `npm install --legacy-peer-deps`
4. **Settings → Environment Variables** → add all `VITE_*` from `env/production.public.example` (VM IP `51.103.219.168`)
5. **Deployments → Redeploy** (or push to `main`)

Repeat for **veil-waitlist** (create project, branch `deploy/waitlist`, build `npm run build:waitlist`, set `VITE_REVIEWER_APP_URL`).

### Option B — CLI prebuilt (fast, ~1.6MB upload)

```powershell
npm install -g vercel
vercel login
$env:VEIL_EC2_HOST = "51.103.219.168"
.\scripts\prepare-production-env.ps1 -VmIp $env:VEIL_EC2_HOST
npm run build:production
vercel deploy --prebuilt --prod --yes --project veil-reviewer
```

Requires `vite.config.ts` Nitro `preset: "vercel"` (already set). Add `VITE_*` env vars in the Vercel dashboard first.

### Option C — CLI full upload (often fails >100MB)

Use Git deploy (Option A) instead of uploading the whole repo.

---

Set these in each Vercel project (Production). Replace `YOUR_VM_IP` with your Azure host (e.g. `51.103.219.168`).

### Reviewer app (`main` · `npm run build:production`)

| Variable | Value |
|----------|-------|
| `VITE_WAITLIST_ONLY` | `false` |
| `VITE_VEIL_API_URL` | `http://YOUR_VM_IP:8787` |
| `VITE_VEIL_ENCLAVE_URL` | `http://YOUR_VM_IP:8080` |
| `VITE_SUI_NETWORK` | `testnet` |
| `VITE_ENOKI_PUBLIC_KEY` | from Enoki dashboard |
| `VITE_GOOGLE_CLIENT_ID` | from Google OAuth |
| `VITE_VEIL_PACKAGE_ID` | from local `.env` |
| `VITE_VEIL_REGISTRY_ID` | from local `.env` |

Build: `npm run build:production` · Output: `dist`

### Public waitlist (`deploy/waitlist` · `npm run build:waitlist`)

| Variable | Value |
|----------|-------|
| `VITE_WAITLIST_ONLY` | `true` |
| `VITE_REVIEWER_APP_URL` | `https://your-reviewer-app.vercel.app` |
| `VITE_VEIL_API_URL` | `http://YOUR_VM_IP:8787` |
| `VITE_VEIL_ENCLAVE_URL` | `http://YOUR_VM_IP:8080` |
| `VITE_SUI_NETWORK` | `testnet` |
| `VITE_ENOKI_PUBLIC_KEY` | same as reviewer |
| `VITE_GOOGLE_CLIENT_ID` | same as reviewer |
| `VITE_VEIL_PACKAGE_ID` | same as reviewer |
| `VITE_VEIL_REGISTRY_ID` | same as reviewer |

Build: `npm run build:waitlist` · Output: `dist`

Local prep scripts merge public keys from `.env` automatically:

```powershell
$env:VEIL_EC2_HOST = "YOUR_VM_IP"
.\scripts\prepare-production-env.ps1 -VmIp $env:VEIL_EC2_HOST
.\scripts\prepare-waitlist-branch.ps1 -VmIp $env:VEIL_EC2_HOST
```
