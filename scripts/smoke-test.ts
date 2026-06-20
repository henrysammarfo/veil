#!/usr/bin/env npx tsx
/**
 * E2E smoke: enclave health → execute modes (no traderAddress → no on-chain mint / no dUSDC spend)
 */
const ENCLAVE = process.env.VEIL_ENCLAVE_URL ?? "http://127.0.0.1:8080";
const API = process.env.VEIL_API_URL ?? "http://127.0.0.1:8787";

async function main() {
  const health = await fetch(`${ENCLAVE}/health`);
  if (!health.ok) throw new Error("enclave health failed");
  console.log("✓ enclave health");

  const order = {
    direction: "LONG",
    asset: "BTC",
    sizeUsdc: 500,
    timeHorizonHours: 168,
    userConvictionPct: 70,
    maxSlippageBps: 50,
    mode: "BULL",
    strike: 110000,
  };

  const execRes = await fetch(`${API}/api/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!execRes.ok) throw new Error(`execute ${execRes.status}`);
  const result = await execRes.json();
  console.log("✓ bull execute", result.executionId);

  if (!result.attestationHash && !result.attestationPayload) {
    throw new Error("missing attestation");
  }
  console.log("✓ attestation present");

  for (const mode of ["BEAR", "EARN", "PARLAY"] as const) {
    const r = await fetch(`${API}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, mode }),
    });
    if (!r.ok) throw new Error(`${mode} failed`);
    const data = await r.json();
    console.log(`✓ ${mode} execute`, data.order?.pnl ?? "");
  }

  const quota = await fetch(`${API}/api/sponsor/quota`);
  if (quota.ok) {
    const q = await quota.json();
    console.log(`✓ sponsor quota ${q.used}/${q.max}`);
  }

  const prefs = await fetch(`${API}/api/prefs?trader=test`);
  if (prefs.ok) console.log("✓ prefs endpoint");

  console.log("SMOKE OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
