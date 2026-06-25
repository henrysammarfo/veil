const BASE = "https://predict-server.testnet.mystenlabs.com";
const mid = process.argv[2] ?? "0x6907fb978a97851803e46782675f8979a33b49ed968484f2edbffc88e55e63bf";
const now = Date.now();

const pres = await fetch(`${BASE}/managers/${mid}/positions/summary`);
const pos = await pres.json();

const interesting = pos.filter((p) => p.open_quantity > 0);
console.log("open positions:", interesting.length, "of", pos.length);
for (const p of interesting.slice(0, 20)) {
  const ttlMin = Math.round((p.expiry - now) / 60_000);
  console.log({
    status: p.status,
    qty: p.open_quantity,
    redeemable: ((p.redeemable_value ?? 0) / 1e6).toFixed(2),
    ttlMin,
    expiry: new Date(p.expiry).toISOString(),
    oracle: p.oracle_id?.slice(0, 20),
    isUp: p.is_up,
  });
}

const summary = await fetch(`${BASE}/managers/${mid}/summary`).then((r) => r.json());
console.log("manager summary:", {
  open: summary.open_positions,
  awaiting: summary.awaiting_settlement_positions,
  balance: ((summary.balances?.[0]?.balance ?? summary.trading_balance ?? 0) / 1e6).toFixed(2),
});
