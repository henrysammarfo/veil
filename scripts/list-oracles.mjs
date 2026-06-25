const BASE = "https://predict-server.testnet.mystenlabs.com";
const PREDICT = "0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a";
const now = Date.now();
const res = await fetch(`${BASE}/predicts/${PREDICT}/oracles`);
const rows = await res.json();
const btc = rows
  .filter((o) => o.status === "active" && o.underlying_asset === "BTC" && o.expiry > now)
  .map((o) => ({
    id: o.oracle_id,
    expiry: o.expiry,
    mins: Math.round((o.expiry - now) / 60_000),
    hours: ((o.expiry - now) / 3_600_000).toFixed(1),
    days: ((o.expiry - now) / 86_400_000).toFixed(2),
  }))
  .sort((a, b) => a.expiry - b.expiry);
console.log("BTC active oracles:", btc.length);
for (const o of btc.slice(0, 20)) {
  console.log(o.hours + "h", "(" + o.mins + "m)", o.id.slice(0, 20) + "…");
}
