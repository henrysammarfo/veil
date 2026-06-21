# Veil — Judge guide (zero stress)

**Live demo:** [https://veil-reviewer.vercel.app](https://veil-reviewer.vercel.app)

You do **not** deploy Azure, set access codes, or configure OpenAI. We host the backend.

**Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) · **Demo script:** [DEMO-SCRIPT.md](./DEMO-SCRIPT.md) · **Submission pack:** [OVERFLOW-SUBMISSION.md](./OVERFLOW-SUBMISSION.md)

---

## Path A — Reviewer URL only (recommended · ~2 min)

Use the **reviewer app** (not the public waitlist site).

1. Open [veil-reviewer.vercel.app](https://veil-reviewer.vercel.app) → **BEGIN JOURNEY**
2. Sign in with **Google** or **Sui Wallet**
3. **Portfolio** → Create manager → Deposit ~50 [dUSDC](https://tally.so/r/Xx102L)
4. **New Order** → type `15m BTC long — quick scalp` → wait for **Auto-configured** → **Submit intent** (~90s)
5. **Orders** → click order → execution payload
6. **Proofs** → attestation hash → `/attest/{hash}`

That's it. No repo clone, no terminal.

---

## Path B — Local UI, team cloud backend (optional)

```powershell
git clone https://github.com/henrysammarfo/veil.git
cd veil
npm install --legacy-peer-deps
.\scripts\judge-check.ps1
.\scripts\judge-terminal.ps1
```

Frontend on `localhost:5174`; API/enclave stay on our VM. No secrets needed.

---

## Path C — Full local stack (power users)

```bash
cp .env.example .env
npm install --legacy-peer-deps
npm run enclave && npm run api && npm run dev:judge
npm run smoke:live
```

Most judges should use **Path A**.

---

## What to verify

| Check | Expected |
|-------|----------|
| Intent parse | `→ BULL · BTC · 15 min · LLM` |
| Form lock | Green **Auto-configured from intent** |
| Execute | Success toast after seal (may take up to 90s) |
| Order detail | Payload JSON + slice progress |
| Proofs | Hash opens `/attest/{hash}` |
| Custody | Your PredictManager on Portfolio |

---

## Plain English → on-chain TWAP

| Step | What happens |
|------|----------------|
| You type intent | LLM parses mode, asset, horizon (minutes/hours/days) |
| Submit | Enclave plans TWAP; **one Predict mint tx per slice** |
| Your funds | **Your** PredictManager — deposit/withdraw/redeem on Portfolio |
| SETTLED | All slices executed; redeem unlocks after market horizon |

Examples: `15m BTC long`, `Bear hedge next 4 hours`, `Earn yield on idle USDC`

---

## Test checklist

- [ ] Portfolio: create manager, deposit, withdraw idle
- [ ] New Order: plain English → locked config → submit
- [ ] BULL: multiple tx digests on one order
- [ ] Order detail click works
- [ ] Proofs + `/attest/{hash}`
- [ ] Discover leaderboard (if leaders exist)

---

## Sui Overflow one-liner

> Stealth execution for DeepBook Predict — LLM plain-English intent, on-chain TWAP mints, ExecutionProof on Sui, user-owned PredictManager.

---

## Security note

Never paste private keys or API keys into the app. Testnet dUSDC only via the [official Predict faucet](https://tally.so/r/Xx102L).
