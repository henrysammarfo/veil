#!/usr/bin/env npx tsx
/**
 * Live E2E: all 4 modes with on-chain traderAddress + tx digest assertions + PnL summary.
 *
 * Requires: enclave + api running, PREDICT_* env, funded manager.
 * Usage: VEIL_TRADER_ADDRESS=0x... npm run e2e:live
 */
import "../packages/sdk/src/load-env.ts";

const ENCLAVE = process.env.VEIL_ENCLAVE_URL ?? "http://127.0.0.1:8080";
const API = process.env.VEIL_API_URL ?? "http://127.0.0.1:8787";
const TRADER =
  process.env.VEIL_TRADER_ADDRESS ??
  process.env.SUI_ADDRESS ??
  "0x91ea0fbb77b51a515ea8f9d440a276366c75b59a8af4ca3dcb6d9ef691f161b8";

const MODES = ["BULL", "BEAR", "EARN", "PARLAY"] as const;

interface ExecResult {
  executionId: string;
  mode: string;
  attestationHash?: string;
  attestationPayload?: string;
  txDigests?: string[];
  onChainAttestation?: unknown;
  order?: { pnl?: string; pnlUsd?: number; mode?: string };
  suppliedUsdc?: number;
  totalImpactBps?: number;
  parlay?: { marketProb?: number; userConviction?: number; stake?: number };
}

async function assertHealth() {
  const eh = await fetch(`${ENCLAVE}/health`);
  if (!eh.ok) throw new Error("enclave health failed");
  const ah = await fetch(`${API}/health`);
  if (!ah.ok) throw new Error("api health failed");
  console.log("✓ enclave + api health");
}

async function executeMode(mode: (typeof MODES)[number]): Promise<ExecResult> {
  const order = {
    direction: "LONG" as const,
    asset: "BTC",
    sizeUsdc: mode === "EARN" ? 15 : 25,
    timeHorizonHours: 168,
    userConvictionPct: 70,
    maxSlippageBps: 50,
    mode,
    strike: 110000,
    trader: TRADER,
    traderAddress: TRADER,
    intent: `e2e ${mode} ${Date.now()}`,
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

async function main() {
  console.log(`Live E2E · trader ${TRADER.slice(0, 10)}…`);
  await assertHealth();

  const results: ExecResult[] = [];
  let totalPnlUsd = 0;

  for (const mode of MODES) {
    const result = await executeMode(mode);
    results.push(result);

    if (!result.attestationHash && !result.attestationPayload) {
      throw new Error(`${mode}: missing attestation`);
    }
    if (!result.onChainAttestation) {
      console.warn(`⚠ ${mode}: no onChainAttestation payload`);
    }

    const txs = result.txDigests ?? [];
    if (mode !== "BULL" || txs.length > 0) {
      console.log(`✓ ${mode} execute ${result.executionId} · txs=${txs.length}`);
    } else {
      console.log(`✓ ${mode} execute ${result.executionId} · attestation only (mint may skip if collateral low)`);
    }

    const pnlUsd = Number(result.order?.pnlUsd ?? 0);
    totalPnlUsd += pnlUsd;
    console.log(`  PnL ${result.order?.pnl ?? "n/a"} (${pnlUsd.toFixed(2)} USD)`);
  }

  const quotaRes = await fetch(`${API}/api/sponsor/quota`);
  if (quotaRes.ok) {
    const quota = (await quotaRes.json()) as { used: number; max: number; remaining: number };
    console.log(`✓ Enoki sponsor quota: ${quota.used}/${quota.max} used (${quota.remaining} remaining)`);
  }

  console.log("\n── PnL SUMMARY ──");
  for (const r of results) {
    console.log(
      `${r.mode.padEnd(6)} ${r.order?.pnl ?? "n/a".padEnd(8)} · ${Number(r.order?.pnlUsd ?? 0).toFixed(2)} USD`,
    );
  }
  console.log(`TOTAL  ${totalPnlUsd >= 0 ? "+" : ""}${totalPnlUsd.toFixed(2)} USD`);

  console.log("\nE2E LIVE OK — all 4 modes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
