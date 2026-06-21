# Veil — Demo video shot list

**Companion to the word-for-word script:** [DEMO-SCRIPT.md](./DEMO-SCRIPT.md)

Record at 1920×1080. Dark theme recommended. Before recording: signed in, manager funded, [health check](https://veil-reviewer.vercel.app) OK.

---

## Shot map (2:30 – 3:00)

| Time | Shot | Script scene |
|------|------|----------------|
| 0:00 | Landing hero | Hook |
| 0:20 | Auth → dashboard | Sign in |
| 0:35 | Portfolio balances | Custody |
| 0:55 | New Order dialog | Intent + 15m parse |
| 1:20 | Submit → sealing spinner | Execute |
| 1:45 | Order detail + payload | Receipt |
| 2:10 | Proofs → /attest/{hash} | Verify |
| 2:35 | README architecture mermaid | Under the hood |
| 2:50 | Logo + URLs end card | Close |

---

## Must-capture frames (for Sui Overflow media upload)

1. **New Order** — green "Auto-configured from intent" + `15 min`  
2. **Order detail** — execution payload (light or dark)  
3. **Proofs** — stream with attestation line  
4. **Architecture** — mermaid from [ARCHITECTURE.md](./ARCHITECTURE.md) or GitHub README  

Optional: `brand/logo-full-dark.png` as banner.

---

## Pre-flight

- [ ] `curl http://51.103.219.168:8787/health` → `{"ok":true,...}`
- [ ] Incognito window, hard refresh
- [ ] Manager + ≥50 dUSDC
- [ ] Notifications off
- [ ] YouTube upload → unlisted → paste in Sui Overflow form

---

## 45 sec teaser (social)

Fast cuts: mempool hook → type `15m BTC long` → auto-config flash → submit toast → attest page → logo.

See full dialogue in [DEMO-SCRIPT.md](./DEMO-SCRIPT.md#short-teaser-cut-45-sec--social).
