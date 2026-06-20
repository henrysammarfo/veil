# Veil — 5-minute demo video shot list

**Record at:** 1920×1080, 60fps if possible. Dark theme dashboard.  
**Before recording:** Azure live (`51.103.219.168`), `npm run smoke` green, wallet or Google signed in.

---

## 0:00–0:25 — Hook

| # | Visual | Voiceover |
|---|--------|-----------|
| 1 | Mempool / order book graphic (or quick B-roll) | "Every on-chain order is public. Front-runners see you coming." |
| 2 | Veil landing hero | "Veil is stealth execution for DeepBook Predict." |
| 3 | Tagline on screen | "Trade smarter. Stay invisible." |

---

## 0:25–1:15 — Architecture (30 sec max)

| # | Visual | Voiceover |
|---|--------|-----------|
| 4 | README / studio page — 4 modes | "Four modes. One TEE enclave. One proof on Sui." |
| 5 | Diagram or quick cut: intent → API → enclave → Move | "Intent in, slices inside Azure enclave, ExecutionProof on-chain." |

---

## 1:15–2:30 — BULL mode (judge money shot)

| # | Visual | Voiceover |
|---|--------|-----------|
| 5a | **Portfolio** → Create manager → Deposit 50 dUSDC | "Fund your own PredictManager — judges keep custody." |
| 6 | `/dashboard` → **New Order** | "Bull mode — directional conviction." |
| 7 | Type in **What do you want to do?** e.g. `I think BTC rips this week` · size **25 dUSDC** | "Plain English in, Kelly-sized slices out." |
| 8 | Submit intent → order card with **STEALTH** badge | "Parent order never hits the mempool." |
| 9 | Proofs tab or order detail — attestation hash | "Every fill is attested." |
| 10 | Suiscan tx link (paste digest) | "On-chain ExecutionProof — verifiable." |

---

## 2:30–3:15 — BEAR + EARN (fast)

| # | Visual | Voiceover |
|---|--------|-----------|
| 11 | `/dashboard/modes` → BEAR simulation table | "Bear — yield plus tail hedge in choppy markets." |
| 12 | EARN order or keeper log mention | "Earn — keeper redeems and re-supplies automatically." |

---

## 3:15–3:45 — PARLAY

| # | Visual | Voiceover |
|---|--------|-----------|
| 13 | PARLAY order submit | "Parlay — correlated legs, one attested execution." |
| 14 | On-chain parlay record if visible | "Recorded on Move as a single proof." |

---

## 3:45–4:30 — Proof + discover

| # | Visual | Voiceover |
|---|--------|-----------|
| 15 | `/attest/{hash}` public viewer | "Anyone can verify an attestation — no login." |
| 16 | `/dashboard/discover` leaderboard | "Live leaderboard from settled orders." |
| 17 | Realized vs expected PnL on an order | "Realized PnL after keeper settlement." |

---

## 4:30–5:00 — Close

| # | Visual | Voiceover |
|---|--------|-----------|
| 18 | Waitlist page | "Public beta waitlist open now." |
| 19 | DeepBook / Sui Overflow logo | "Built for Sui Overflow 2026. DeepBook Predict testnet." |
| 20 | GitHub + demo URL | "Clone locally — judges run in five minutes." |

---

## Recording checklist

- [ ] `curl http://51.103.219.168:8787/health` OK
- [ ] Signed in (Google or wallet)
- [ ] Portfolio: manager created + ≥50 dUSDC deposited
- [ ] Plain-English intent typed in New Order (not auto-generated)
- [ ] Order size 10–50 dUSDC (testnet)
- [ ] Suiscan tab ready for tx paste
- [ ] Notifications / Slack off
- [ ] Upload **unlisted** YouTube → DeepSurge link

---

## Teaser (30–45 sec) — optional social cut

Fast cuts only — no black "coming soon" until last 3 seconds:

1. Slice counter animating  
2. STEALTH badge flash  
3. Beat drop → 4 mode tabs  
4. Attestation seal animation  
5. End card: **Veil — coming soon**
