# Veil — Judge & reviewer guide

Clone and run locally. No cloud account required.

## Quick start

```bash
git clone <repo-url>
cd veil
cp .env.example .env
npm install
npm run enclave   # terminal 1 — port 8080
npm run api       # terminal 2 — port 8787
npm run keeper    # terminal 3 — settlement sync
npm run dev       # terminal 4 — frontend :5173
```

Fill `.env` with your own testnet keys (see `.env.example`). Never commit `.env`.

## Judge access

The public site is **waitlist-only**. Reviewers receive an access code in the **DeepSurge submission packet** (not in this repo).

1. Open `/auth`
2. Enter the code from submission notes (or `/auth?judge=CODE` if provided privately)
3. Sign in with **Google zkLogin** (Enoki-sponsored gas) or **Sui Wallet**

For local testing, set `VITE_JUDGE_ACCESS_CODE` in your local `.env` only.

## Testnet capital

| Asset | Notes |
|-------|--------|
| **dUSDC** | Required for all modes. Min **10 dUSDC** per EARN supply. |
| **SUI** | Not required for Google users when Enoki sponsorship is configured. |

## What to test

1. All **4 modes** — BULL, BEAR, EARN, PARLAY
2. **Stealth execution** — STEALTH badge on orders
3. **ExecutionProof** — on-chain object; Proofs tab
4. **Attestation viewer** — `/attest/{hash}`
5. **Discover leaderboard** — `/api/leaders`
6. **Realized vs expected PnL** — after keeper settlement

## Automated tests

```bash
npm run smoke
npm run e2e:live
npm run move:test
npm run test
```

## Wallet auth

| Method | What you get |
|--------|----------------|
| **Google + Enoki** | Derived zkLogin Sui address; gas may be sponsored on testnet. |
| **Sui Wallet** | Your own key; you sign directly. |

Optional wallet linking is stored in server prefs only — not a key migration.

## Contracts

Move sources: `packages/move/veil/sources/`
