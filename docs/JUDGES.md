# Veil — Judge guide (zero stress)

**You do not deploy Azure, set access codes, or configure OpenAI.** We host the backend. Pick one path below.

---

## Path A — Reviewer URL only (recommended · ~2 min)

Use the **reviewer app URL** from our DeepSurge submission (not the public waitlist site).

1. Open URL → **BEGIN JOURNEY**
2. Sign in with **Google** or **Sui Wallet**
3. **Portfolio** → Create manager → Deposit ~50 [dUSDC](https://tally.so/r/Xx102L) (faucet first if needed)
4. **New Order** → type plain English, e.g. `I think Bitcoin rips this week — go long` → **Submit intent**
5. **Proofs** → copy attestation hash → `/attest/{hash}` on same site

That’s it. No repo clone, no terminal, no cloud setup.

---

## Path B — Local UI, team cloud backend (optional)

Same app as Path A, but UI runs on your machine; API/enclave stay on our VM.

```powershell
git clone <repo-url>
cd veil
npm install --legacy-peer-deps
.\scripts\judge-check.ps1          # verify our cloud is up
.\scripts\judge-terminal.ps1       # opens http://localhost:5174
```

Or: `npm run judge:terminal`

You still **do not** need Azure, `.env` secrets, or OpenAI keys — frontend talks to our hosted API.

---

## Path C — Full local stack (power users only)

Only if you want to run enclave + API yourself (requires team `.env` template + testnet keys):

```bash
cp .env.example .env   # fill from submission notes / ask team
npm install --legacy-peer-deps
npm run enclave   # :8080
npm run api       # :8787
npm run dev:judge # :5174
npm run smoke:live   # wallet + on-chain TWAP (uses your SUI_PRIVATE_KEY in .env)
```

Most judges should use **Path A**.

---

## Verify our cloud (terminal, no secrets)

```powershell
.\scripts\judge-check.ps1
# or
npm run judge:check
```

Checks: enclave health, API health, LLM intent parse.

---

## Plain English + on-chain TWAP

| Step | What happens |
|------|----------------|
| You type intent | LLM parses in our enclave (mode, asset, conviction) |
| BULL order | Up to 3–5 **separate Predict mint txs** (real TWAP, not simulated) |
| Your funds | **Your** PredictManager — deposit/withdraw on Portfolio |

Examples: `I think BTC rips this week`, `Earn yield on idle USDC`, `Bear hedge ETH for a few days`

---

## Test checklist

- [ ] Portfolio: create manager, deposit, withdraw idle balance
- [ ] New Order: plain English → Submit intent
- [ ] BULL: multiple tx digests (Suiscan) from one order
- [ ] BEAR, EARN, PARLAY once each
- [ ] Proofs + `/attest/{hash}`
- [ ] Discover leaderboard

---

## DeepSurge one-liner

> Stealth execution for DeepBook Predict — LLM plain-English intent, on-chain TWAP mints, ExecutionProof on Sui, user-owned PredictManager.

---

## Security note for judges

Never paste private keys or API keys into the app. Testnet dUSDC only via the official Predict faucet.
