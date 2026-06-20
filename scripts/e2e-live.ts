#!/usr/bin/env npx tsx
/**
 * Live wallet smoke — real on-chain TWAP + LLM intent (NOT read-only).
 *
 * Requires: api + enclave running, SUI_PRIVATE_KEY, funded PredictManager.
 * Optional: OPENAI_API_KEY for LLM intent (rules fallback if missing).
 *
 * Usage:
 *   npm run smoke:live
 *   VEIL_API_URL=http://51.103.219.168:8787 npm run smoke:live
 */
import "../packages/sdk/src/load-env.ts";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fetchManagerForOwner, fetchManagerSummary } from "../packages/sdk/src/predict-market.ts";

const ENCLAVE = process.env.VEIL_ENCLAVE_URL ?? "http://127.0.0.1:8080";
const API = process.env.VEIL_API_URL ?? "http://127.0.0.1:8787";
const TWAP_EXPECT = Number(process.env.TWAP_MAX_SLICES ?? "5");

const MODES = ["BULL", "BEAR", "EARN", "PARLAY"] as const;

interface ExecResult {
  executionId: string;
  mode: string;
  attestationHash?: string;
  attestationPayload?: string;
  txDigests?: string[];
  fills?: { sliceNumber: number; txDigest?: string; price: number; size: number }[];
  sliceCount?: number;
  executionMode?: string;
  onChainAttestation?: unknown;
  order?: { pnl?: string; pnlUsd?: number; mode?: string; slices?: { filled: number; total: number } };
  suppliedUsdc?: number;
}

function resolveTrader(): string {
  if (process.env.VEIL_TRADER_ADDRESS) return process.env.VEIL_TRADER_ADDRESS;
  if (process.env.SUI_ADDRESS) return process.env.SUI_ADDRESS;
  const key = process.env.SUI_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      "Set SUI_PRIVATE_KEY (or VEIL_TRADER_ADDRESS) — smoke:live requires a real wallet, not read-only.",
    );
  }
  return Ed25519Keypair.fromSecretKey(key).getPublicKey().toSuiAddress();
}

async function resolveManagerId(trader: string): Promise<string> {
  const fromEnv = process.env.PREDICT_MANAGER_ID;
  if (fromEnv) return fromEnv;
  const onChain = await fetchManagerForOwner(trader);
  if (!onChain) {
    throw new Error(
      `No PredictManager for ${trader}. Create + fund via Portfolio or npm run setup:predict`,
    );
  }
  return onChain;
}

async function assertHealth() {
  const eh = await fetch(`${ENCLAVE}/health`);
  if (!eh.ok) throw new Error(`enclave health failed (${ENCLAVE})`);
  const ah = await fetch(`${API}/health`);
  if (!ah.ok) throw new Error(`api health failed (${API})`);
  console.log("✓ enclave + api health");
}

async function testIntentParse() {
  const text = "I think Bitcoin rips this week — go long with high conviction";
  const res = await fetch(`${API}/api/intent/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`intent parse ${res.status}`);
  const parsed = (await res.json()) as {
    mode: string;
    asset: string;
    direction: string;
    source?: string;
  };
  if (parsed.mode !== "BULL" || parsed.asset !== "BTC") {
    throw new Error(`intent parse unexpected: ${JSON.stringify(parsed)}`);
  }
  const via = parsed.source === "llm" ? "LLM" : "rules";
  console.log(`✓ intent parse (${via}) → ${parsed.mode} ${parsed.direction} ${parsed.asset}`);
}

async function executeMode(
  mode: (typeof MODES)[number],
  trader: string,
  managerId: string,
): Promise<ExecResult> {
  const order = {
    direction: "LONG" as const,
    asset: "BTC",
    sizeUsdc: mode === "EARN" ? 15 : 25,
    timeHorizonHours: 168,
    userConvictionPct: 70,
    maxSlippageBps: 50,
    mode,
    strike: 110000,
    trader,
    traderAddress: trader,
    managerId,
    intent:
      mode === "BULL"
        ? "I think Bitcoin rips this week — go long"
        : `e2e live ${mode} ${Date.now()}`,
  };

  const res = await fetch(`${API}/api/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${mode} execute ${res.status}: ${text}`);
  }
  return res.json() as Promise<ExecResult>;
}

function assertBullTwap(result: ExecResult) {
  if (result.executionMode && result.executionMode !== "on_chain_twap") {
    throw new Error(`BULL expected on_chain_twap, got ${result.executionMode}`);
  }
  const txs = result.txDigests ?? [];
  const fills = result.fills ?? [];
  const onChainFills = fills.filter((f) => f.txDigest);

  if (txs.length === 0) {
    throw new Error(
      "BULL TWAP: zero on-chain txs — fund manager with dUSDC or check enclave deploy",
    );
  }
  if (onChainFills.length === 0 && fills.length > 0) {
    throw new Error("BULL TWAP: fills present but missing txDigest on each slice");
  }
  if (txs.length < TWAP_EXPECT) {
    console.warn(
      `⚠ BULL TWAP: ${txs.length}/${TWAP_EXPECT} slice txs (partial — check manager balance)`,
    );
  } else {
    console.log(`✓ BULL on-chain TWAP · ${txs.length} mint txs`);
  }
  for (const d of txs) {
    console.log(`  tx ${d.slice(0, 18)}…`);
  }
}

async function main() {
  const trader = resolveTrader();
  const managerId = await resolveManagerId(trader);
  const summary = await fetchManagerSummary(managerId);
  const bal = summary ? Number(summary.balanceMicro) / 1_000_000 : 0;

  console.log(`Live wallet smoke · ${API}`);
  console.log(`  trader  ${trader.slice(0, 10)}…${trader.slice(-6)}`);
  console.log(`  manager ${managerId.slice(0, 10)}… · ${bal.toFixed(2)} dUSDC idle`);
  if (bal < 10) {
    console.warn("⚠ manager balance low — mints may partial-fail");
  }

  await assertHealth();
  await testIntentParse();

  const results: ExecResult[] = [];
  let totalPnlUsd = 0;

  for (const mode of MODES) {
    const result = await executeMode(mode, trader, managerId);
    results.push(result);

    if (!result.attestationHash && !result.attestationPayload) {
      throw new Error(`${mode}: missing attestation`);
    }

    if (mode === "BULL") {
      assertBullTwap(result);
    } else {
      const txs = result.txDigests ?? [];
      console.log(`✓ ${mode} execute ${result.executionId} · txs=${txs.length}`);
    }

    const pnlUsd = Number(result.order?.pnlUsd ?? 0);
    totalPnlUsd += pnlUsd;
    console.log(`  PnL ${result.order?.pnl ?? "n/a"}`);
  }

  const sync = await fetch(`${API}/api/settlement/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ managerId }),
  });
  if (sync.ok) {
    const s = (await sync.json()) as { updated: number };
    console.log(`✓ settlement sync · ${s.updated} orders updated`);
  }

  console.log("\n── PnL SUMMARY ──");
  for (const r of results) {
    console.log(`${r.mode.padEnd(6)} ${r.order?.pnl ?? "n/a"}`);
  }
  console.log(`TOTAL  ${totalPnlUsd >= 0 ? "+" : ""}${totalPnlUsd.toFixed(2)} USD (expected)`);

  console.log("\nSMOKE LIVE OK — wallet + on-chain TWAP verified");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
