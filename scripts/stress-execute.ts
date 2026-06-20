#!/usr/bin/env npx tsx
/**
 * Stress: rapid parallel executes across all 4 modes + sponsor quota check.
 */
import "../packages/sdk/src/load-env.ts";

const API = process.env.VEIL_API_URL ?? "http://127.0.0.1:8787";
const TRADER = process.env.VEIL_TRADER_ADDRESS ?? "0x91ea0fbb77b51a515ea8f9d440a276366c75b59a8af4ca3dcb6d9ef691f161b8";
const ROUNDS = Number(process.env.STRESS_ROUNDS ?? "8");
const CONCURRENCY = Number(process.env.STRESS_CONCURRENCY ?? "4");

const MODES = ["BULL", "BEAR", "EARN", "PARLAY"] as const;

async function execute(mode: (typeof MODES)[number], i: number) {
  const t0 = Date.now();
  const res = await fetch(`${API}/api/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      direction: "LONG",
      asset: "BTC",
      sizeUsdc: 12,
      timeHorizonHours: 72,
      userConvictionPct: 65,
      maxSlippageBps: 50,
      mode,
      trader: TRADER,
      traderAddress: TRADER,
      intent: `stress ${mode} ${i}`,
    }),
  });
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`${mode}#${i} ${res.status} (${ms}ms)`);
  const data = (await res.json()) as { executionId?: string };
  return { mode, i, ms, id: data.executionId };
}

async function pool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const out: T[] = [];
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      out[i] = await tasks[i]!();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return out;
}

async function main() {
  const tasks: (() => ReturnType<typeof execute>)[] = [];
  for (let r = 0; r < ROUNDS; r++) {
    for (const mode of MODES) {
      tasks.push(() => execute(mode, r * MODES.length + MODES.indexOf(mode)));
    }
  }

  const start = Date.now();
  const results = await pool(tasks, CONCURRENCY);
  const durationMs = Date.now() - start;
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);
  const byMode = Object.fromEntries(MODES.map((m) => [m, results.filter((r) => r.mode === m).length]));

  console.log({
    total: results.length,
    durationMs,
    avgMs,
    byMode,
    rounds: ROUNDS,
    concurrency: CONCURRENCY,
  });

  const quota = await fetch(`${API}/api/sponsor/quota`).then((r) => r.json());
  console.log("sponsor quota:", quota);

  console.log("STRESS EXECUTE OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
