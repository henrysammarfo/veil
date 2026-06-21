# Sui Overflow 2026 — Veil submission pack

**Track:** Special — **DeepBook**  
**Deadline:** June 21, 2026 · 6:00 PM Pacific  
**Demo Day (if shortlisted):** July 21, 2026 — DeFi & DeepBook tracks

---

## Submission checklist

| Field | Value |
|-------|-------|
| **Project name** | Veil |
| **Track** | Special — DeepBook |
| **Logo** | `brand/logo-mark.png` (1:1 PNG for form) |
| **Website** | https://veil-reviewer.vercel.app |
| **GitHub** | https://github.com/henrysammarfo/veil (public) |
| **Package ID** | `0xb69f928ef4cd96ea9f0cb6c6d3e559f4cece9c500f56d2fb9199569d222d54da` |
| **Demo video** | ⚠️ **Record + upload** — script in [DEMO-SCRIPT.md](./DEMO-SCRIPT.md) |
| **Judge guide** | [JUDGES.md](./JUDGES.md) |

---

## Copy-paste: short description

Veil is stealth execution for DeepBook Predict on Sui testnet. Traders describe intent in plain English; a TEE enclave plans Kelly-sized TWAP slices as real `predict::mint` txs through your own PredictManager, with TEE attestation, Move ExecutionProof, and Walrus MemWal provenance.

---

## Copy-paste: long description

Veil turns plain-English trading intent into private, on-chain TWAP execution on DeepBook Predict (Sui testnet). Users sign in with Google zkLogin or Sui Wallet, create a user-owned PredictManager, deposit testnet dUSDC, and submit intents like "15m BTC long — quick scalp." An Azure-hosted enclave parses mode/asset/horizon via LLM, executes one Predict mint transaction per TWAP slice against live SVI/oracle context, writes MemWal provenance blobs, and returns cryptographic attestations verifiable at `/attest/{hash}`. Four modes — BULL, BEAR, EARN, PARLAY — share one proof story. Move package records ExecutionProof on Sui when configured.

**Live demo:** https://veil-reviewer.vercel.app  
**Judge path:** https://github.com/henrysammarfo/veil/blob/main/docs/JUDGES.md

---

## Copy-paste: judge instructions (submission notes)

1. Open https://veil-reviewer.vercel.app → **BEGIN JOURNEY** → Google or Sui Wallet  
2. **Portfolio** → create PredictManager → deposit dUSDC ([faucet](https://tally.so/r/Xx102L))  
3. **New Order** → `15m BTC long — quick scalp` → wait ~90s for seal  
4. **Orders** → detail → **Proofs** → `/attest/{hash}`  
5. Full guide: `docs/JUDGES.md` in repo

No repo clone or Azure setup required.

---

## Minimum requirements (DeepBook track)

| Requirement | Veil |
|-------------|------|
| Integrate Predict testnet | ✅ `predict-testnet-4-16` pinned in SDK |
| End-to-end product flow | ✅ Auth → manager → deposit → intent → mint → proofs |
| User PredictManager | ✅ Create / deposit / withdraw / redeem in Portfolio |
| Real mint txs (BULL) | ✅ One `predict::mint` per TWAP slice |
| dUSDC | ✅ Testnet faucet linked in UI |

---

## Judging criteria — self-score

| Criterion | Weight | Strength | Gap to address |
|-----------|--------|----------|----------------|
| Product & UX | 20% | Polished dashboard, intent lock, Pro/Lite modes | Record demo video |
| Real-world application | 50% | Stealth execution for prediction markets; user custody | Clarify enclave signs txs against user-funded manager |
| Technical implementation | 20% | Move proofs, SVI, keeper, MemWal, long execute proxy | Ensure Vercel has `VITE_VEIL_PACKAGE_ID` for on-chain record |
| Presentation & vision | 10% | Strong docs + architecture mermaid | **Demo video required** |

---

## Demo video must-show (≤ 5 min)

- [ ] Problem hook: public mempool / front-running on prediction markets  
- [ ] Sign in (Google or wallet)  
- [ ] Portfolio: PredictManager + dUSDC deposit  
- [ ] New Order: plain English → **Auto-configured from intent**  
- [ ] Submit → full ~90s seal (do not cut)  
- [ ] Order detail: payload + tx digests  
- [ ] SETTLED vs redeem (oracle horizon) — 10 sec  
- [ ] Proofs + `/attest/{hash}`  
- [ ] End card: URL + GitHub + package ID  

Script: [DEMO-SCRIPT.md](./DEMO-SCRIPT.md)

---

## Pre-submit runbook (today)

```powershell
.\scripts\judge-check.ps1
# Confirm Azure health + enclave

# On reviewer URL (Incognito):
# 1. Sign in → Portfolio → fund manager
# 2. Place one BULL order → verify tx digests
# 3. Open /attest/{hash}
```

Record video → upload unlisted YouTube → paste URL in DeepSurge form.

---

## Honest scope notes (for Q&A)

- **Mint txs** are signed by the enclave hot wallet against **your** funded PredictManager (not a shared pool).  
- **BULL** is fully on-chain TWAP; BEAR/EARN/PARLAY display expected PnL until settlement.  
- **TEE** on Azure is a Nautilus-compatible template + HMAC attestation (see `SECURITY.md`).  
- **Redeem** appears after Predict market expiry + oracle settlement (15m orders redeem faster than 7d).
