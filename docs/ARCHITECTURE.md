# Veil Architecture

Veil is a stealth execution layer for **DeepBook Predict** on Sui testnet. Users express intent in plain English; a TEE enclave plans and signs execution; the API records orders and proofs; on-chain Move modules anchor attestations.

**Live demo:** [veil-reviewer.vercel.app](https://veil-reviewer.vercel.app)

---

## System overview

```mermaid
flowchart TB
  subgraph Client["Client (Browser)"]
    UI[TanStack Start Dashboard]
    Auth[zkLogin / Sui Wallet]
  end

  subgraph Edge["Vercel Edge"]
    CDN[Static + SSR]
    Proxy["/api/* proxy"]
    ExecuteFn["/api/execute<br/>(long timeout)"]
  end

  subgraph Azure["Azure VM"]
    API[veil-api :8787]
    Enclave[veil-enclave :8080]
    Keeper[veil-keeper]
  end

  subgraph External["External Services"]
    Predict[predict-server.testnet.mystenlabs.com]
    LLM[OpenAI-compatible LLM]
    MemWal[MemWal / Walrus staging]
  end

  subgraph Chain["Sui Testnet"]
    Move[veil Move package]
    PredictMgr[User PredictManager]
    Proof[execution_proof]
  end

  UI --> Auth
  UI --> CDN
  UI --> Proxy
  UI --> ExecuteFn
  Proxy --> API
  ExecuteFn --> API
  API --> Enclave
  API --> Predict
  Enclave --> LLM
  Enclave --> Predict
  Enclave --> MemWal
  Enclave --> Move
  Keeper --> Predict
  Keeper --> API
  PredictMgr --> Predict
  UI --> PredictMgr
  Move --> Proof
```

---

## Order lifecycle (BULL / 15m example)

```mermaid
sequenceDiagram
  actor User
  participant UI as Dashboard
  participant API as veil-api
  participant Enc as veil-enclave
  participant LLM as Intent LLM
  participant Pred as Predict Server
  participant Sui as Sui Testnet

  User->>UI: Type "15m BTC long — quick scalp"
  UI->>API: POST /api/intent/parse
  API->>Enc: /parse_intent
  Enc->>LLM: Structured JSON (mode, asset, horizon)
  LLM-->>Enc: BULL · BTC · 15 min
  Enc-->>UI: Parsed intent (auto-config lock)

  User->>UI: Submit intent (25 dUSDC)
  UI->>API: POST /api/execute
  API->>Enc: /execute
  Enc->>Pred: Live oracle + SVI context
  loop TWAP slices (3–5 mints)
    Enc->>Sui: predict_manager mint tx
    Sui-->>Enc: tx digest + fill
  end
  Enc->>MemWal: Execution report blob
  Enc->>Sui: record_execution (optional)
  Enc-->>API: executionId, fills, attestation
  API-->>UI: Order SETTLED / EXECUTING
  User->>UI: Open order detail + Proofs
```

---

## Four execution modes

```mermaid
flowchart LR
  Intent[Plain English Intent] --> Parse[LLM + Rules Parser]
  Parse --> Router{Mode}

  Router --> BULL[BULL<br/>TWAP directional mints]
  Router --> BEAR[BEAR<br/>Vault + hedge sim]
  Router --> EARN[EARN<br/>PLP supply + keeper]
  Router --> PARLAY[PARLAY<br/>Multi-leg correlated]

  BULL --> TWAP[twap-onchain.ts]
  BEAR --> Vault[bearVaultOnChain]
  EARN --> Supply[withdraw + supply PLP]
  PARLAY --> Legs[parlayMintsOnChain]

  TWAP --> Proof[TEE attestation + MemWal]
  Vault --> Proof
  Supply --> Proof
  Legs --> Proof
  Proof --> Move[veil::execution_proof]
```

| Mode | On-chain behavior | Capital |
|------|-------------------|---------|
| **BULL** | Sequential Predict mint txs (TWAP slices) | User PredictManager dUSDC |
| **BEAR** | Covered range / vault path | User PredictManager |
| **EARN** | Withdraw idle → PLP supply; keeper redeems | User PredictManager |
| **PARLAY** | Correlated multi-leg mints + parlay record | User PredictManager |

---

## Trust & verification

```mermaid
flowchart TB
  subgraph Enclave["veil-enclave"]
    Plan[Execution plan]
    Sign[HMAC / enclave signing key]
    Seal[Seal state optional]
  end

  subgraph Provenance["Provenance"]
    MW[MemWal blob]
    WR[Walrus report URL]
  end

  subgraph Verify["Public verify"]
    Attest["/attest/{hash}"]
    MoveV[Move execution_proof]
    Store[API proof store]
  end

  Plan --> Sign
  Sign --> MW
  MW --> WR
  Sign --> MoveV
  Sign --> Store
  Store --> Attest
  MoveV --> Attest
```

Every execution produces:

1. **TEE-signed attestation payload** (enclave HMAC / execution digest)
2. **MemWal blob** with full execution metadata
3. **On-chain `execution_proof`** (when trader address + registry configured)
4. **Dashboard proof console** + public `/attest/{hash}` page

---

## Monorepo map

```
veil/
├── src/                      TanStack Start UI (dashboard, auth, attest)
├── api/execute.ts            Vercel serverless — long-running execute proxy
├── packages/
│   ├── move/veil/            Sui Move: registry, attestation, execution_proof, parlay
│   ├── execution-engine/     SVI, Kelly, TWAP scheduling, mode planners
│   ├── sdk/                  Predict PTBs, intent LLM, twap-onchain, clients
│   ├── veil-enclave/         TEE HTTP server (parse, execute, verify)
│   └── walrus-reporter/      MemWal adapter
└── services/
    ├── veil-api/             Gateway, order store, settlement sync, leaders
    └── keeper/               Earn redeem + PLP drip loop
```

---

## Deployment topology

```mermaid
flowchart LR
  subgraph Vercel["Vercel"]
    Reviewer[veil-reviewer.vercel.app]
    Waitlist[veil-waitlist optional]
  end

  subgraph VM["Azure VM 51.103.219.168"]
    PM2[pm2]
    PM2 --> API2[veil-api]
    PM2 --> ENC2[veil-enclave]
    PM2 --> K2[veil-keeper]
  end

  Reviewer -->|"/api/*"| API2
  Reviewer -->|"/api/execute"| API2
  Waitlist -.->|waitlist only| Reviewer
```

| Surface | URL / port | Role |
|---------|------------|------|
| Reviewer app | `https://veil-reviewer.vercel.app` | Judges & demo |
| veil-api | `:8787` | REST gateway, order persistence |
| veil-enclave | `:8080` | Intent parse + execute (TEE) |
| veil-keeper | background | Redeem settled → PLP drip |

---

## DeepBook Predict integration

| Resource | Testnet value |
|----------|----------------|
| Predict server | `https://predict-server.testnet.mystenlabs.com` |
| Live market | **BTC/USDC** |
| dUSDC faucet | [tally.so/r/Xx102L](https://tally.so/r/Xx102L) |
| Veil Move package | `0xb69f928ef4cd96ea9f0cb6c6d3e559f4cece9c500f56d2fb9199569d222d54da` |

User flow: **wallet dUSDC → PredictManager deposit → enclave mints → permissionless redeem → manager balance**.

---

## Key design decisions

1. **User-owned PredictManager** — judges and users keep custody; Veil never pools customer funds in a shared demo wallet for production flow.
2. **Real TWAP** — each slice is a separate on-chain Predict mint (`twap-onchain.ts`), not a simulated fill counter.
3. **Intent-locked UI** — LLM sets mode, asset, and horizon; manual override disables submit to prevent horizon mismatch.
4. **Long execute path** — Vercel `/api/execute` serverless function avoids 502 on 60–90s enclave sealing.
5. **SETTLED vs redeem** — UI "SETTLED" means slices complete; Portfolio redeem unlocks after Predict market horizon + oracle settlement.

---

## Related docs

- [Demo video script](./DEMO-SCRIPT.md) — word-for-word recording guide
- [Judge guide](./JUDGES.md) — 2-minute path for reviewers
- [Deploy](./DEPLOY.md) — Vercel + Azure
- [Security](../SECURITY.md) — scope and limitations
