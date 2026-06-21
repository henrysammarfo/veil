# Veil — Demo video script (word-for-word)

**Target length:** 2 minutes 30 seconds – 3 minutes  
**Record at:** 1920×1080, dark theme (switch to light for one shot if you want)  
**Mic:** Clear voice, no music under dialogue until the end card  

**Before you hit record**

- [ ] Open [veil-reviewer.vercel.app](https://veil-reviewer.vercel.app) in Incognito
- [ ] Signed in (Google or Sui Wallet)
- [ ] Portfolio: PredictManager created, ≥50 dUSDC deposited ([faucet](https://tally.so/r/Xx102L) if needed)
- [ ] Close Slack / notifications
- [ ] Optional second tab: Suiscan testnet ready to paste a tx hash

---

## Scene 1 — Hook (0:00 – 0:20)

**SCREEN:** Veil landing page → scroll slightly to hero / tagline  

**SAY:**

> "On most trading systems, your intent is public the moment you submit.  
> Front-runners, copy-traders, and the mempool all see you coming.  
> **Veil** is different.  
> It's stealth execution for **DeepBook Predict** on Sui — you speak in plain English, and the enclave executes on-chain TWAP slices through **your** manager, with a cryptographic proof for every fill.  
> **Trade smarter. Stay invisible.**"

**ACTION:** Click **Begin Journey** or go to dashboard if already signed in.

---

## Scene 2 — Sign in (0:20 – 0:35)

**SCREEN:** `/auth` → click Google or Sui Wallet → land on `/dashboard`  

**SAY:**

> "Judges can sign in with Google zkLogin or a Sui wallet — no local setup, no API keys.  
> The reviewer app talks to our hosted enclave on Azure; you only need testnet **dUSDC**."

**ACTION:** If already signed in, skip voice and cut straight to Portfolio.

---

## Scene 3 — Portfolio / custody (0:35 – 0:55)

**SCREEN:** Sidebar → **Portfolio**  

**SAY:**

> "First, **your** capital.  
> Veil uses a user-owned **PredictManager** on DeepBook Predict testnet.  
> I create a manager once — free transaction — then deposit testnet dUSDC from my wallet."

**ACTION:** Point cursor at **Manager balance** and **Wallet dUSDC**. If manager already exists, just highlight balances.

**SAY (continued):**

> "This isn't a shared demo pool. Withdraw idle balance anytime. Redeem settled positions here after the market horizon."

**ACTION:** Click **Refresh** once (optional).

---

## Scene 4 — Plain English order (0:55 – 1:45) ★ Money shot

**SCREEN:** Sidebar → **Orders** → **+ NEW ORDER**  

**SAY:**

> "Here's the core loop.  
> I don't fill out a dozen fields. I describe what I want."

**ACTION:** Click in the intent box. Type slowly (or paste):

```
15m BTC long — quick scalp to the upside
```

**SAY (while it parses):**

> "Veil's enclave parses that with GPT — mode, asset, and horizon.  
> Watch the tag: **BULL**, **BTC**, **fifteen minutes**.  
> The form **locks** to the intent so I can't accidentally submit seven days when I said fifteen minutes."

**ACTION:** Point at green box **Auto-configured from intent** and the parse line `→ BULL · LONG · BTC · 15 min · LLM`.

**SAY:**

> "I only adjust size — twenty-five dUSDC — and submit."

**ACTION:** Set size slider to **25**. Click **Submit intent**.

**SAY (while sealing):**

> "Sealing runs inside the TEE. Real on-chain TWAP — one Predict mint transaction per slice — not simulated fills. This can take up to ninety seconds; keep the tab open."

**ACTION:** Wait for success toast. Do not cut away mid-seal if possible.

**SAY (on success):**

> "Order placed. Slices are on Sui testnet now."

---

## Scene 5 — Order detail + payload (1:45 – 2:10)

**SCREEN:** Click the new order row → order detail page  

**SAY:**

> "Every order has a full receipt — intent, slice progress, and the raw **execution payload**.  
> Judges can inspect JSON fills, implied probability, and transaction digests."

**ACTION:** Scroll to **Execution payload**. Toggle light mode briefly if you want to show readability (optional).

**SAY:**

> "In the Orders list, **SETTLED** means all slices executed.  
> **Redeem** on Portfolio comes later, after the fifteen-minute market horizon and oracle settlement."

**ACTION:** Click **← All orders**.

---

## Scene 6 — Proofs + public verify (2:10 – 2:35)

**SCREEN:** Sidebar → **Proofs**  

**SAY:**

> "Every action emits a proof — attestation hash, enclave ID, optional Walrus report link."

**ACTION:** Click one proof line OR copy hash from list.

**SAY:**

> "Anyone can verify without logging in."

**ACTION:** Navigate to `/attest/{hash}` (paste hash in URL bar or click link if available).

**SAY:**

> "Public attestation viewer — same site, no account required."

---

## Scene 7 — Architecture flash (2:35 – 2:50)

**SCREEN:** GitHub README or `docs/ARCHITECTURE.md` mermaid diagram (scroll slowly)  

**SAY:**

> "Under the hood: TanStack dashboard on Vercel, API and Nautilus-compatible enclave on Azure, DeepBook Predict server for live oracles, Move modules for **execution_proof** on Sui, and MemWal for provenance.  
> Four modes — **Bull**, **Bear**, **Earn**, **Parlay** — one enclave, one proof story."

**ACTION:** Show architecture diagram for 3–5 seconds. Optional quick flash of `/dashboard/modes`.

---

## Scene 8 — Close (2:50 – 3:00)

**SCREEN:** Dashboard hero or logo + URLs on screen (add text overlay in editor)  

**SAY:**

> "**Veil** — intelligent stealth execution for DeepBook Predict.  
> Live demo at **veil-reviewer.vercel.app**.  
> Open source on GitHub — **henrysammarfo slash veil**.  
> Built for **Sui Overflow twenty-twenty-six**.  
> Trade smarter. Stay invisible."

**ACTION:** Fade to logo `brand/logo-mark.png` + URLs:

- https://veil-reviewer.vercel.app  
- https://github.com/henrysammarfo/veil  

---

## B-roll checklist (optional inserts)

| Timestamp | Clip |
|-----------|------|
| During seal | Slice progress bar animating |
| After submit | Suiscan tx digest paste |
| Scene 7 | 4 mode tiles on `/dashboard/modes` |
| End | `brand/logo-full-dark.png` |

---

## YouTube upload

- **Title:** `Veil — Stealth Execution for DeepBook Predict | Sui Overflow 2026`
- **Description:** paste README tagline + demo URL + repo + testnet package ID
- **Visibility:** Unlisted (fine for Sui Overflow form)
- **Thumbnail:** `brand/logo-mark.png` + text "Veil · DeepBook"

---

## If something fails on camera

| Problem | What to say / do |
|---------|------------------|
| 502 on submit | "Enclave can take a retry — we proxy execute with a long timeout on Vercel." Cut, retry once. |
| Parse slow | Keep talking over "Parsing intent…" — fills dead air. |
| No dUSDC | Cut to faucet tab for 2 sec, deposit, resume. |
| Already have order | "Here's a completed fifteen-minute order from earlier" → open detail instead of new submit. |

---

## Short teaser cut (45 sec) — social

1. "Front-runners see you coming." (0:05)  
2. Type `15m BTC long` (0:10)  
3. Auto-config lock flash (0:15)  
4. Submit → toast (0:25)  
5. Proof hash → /attest (0:35)  
6. Logo end card (0:45)
