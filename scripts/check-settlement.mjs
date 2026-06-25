import fs from "fs";
const BASE = "https://predict-server.testnet.mystenlabs.com";
const mid = "0x6907fb978a97851803e46782675f8979a33b49ed968484f2edbffc88e55e63bf";
const pres = await fetch(`${BASE}/managers/${mid}/positions/summary`);
const pos = await pres.json();
console.log("total positions:", pos.length);
for (const p of pos.slice(0, 15)) {
  console.log({
    status: p.status,
    qty: p.open_quantity,
    redeemable: (p.redeemable_value ?? 0) / 1e6,
    expiry: p.expiry,
    expiryIso: p.expiry ? new Date(p.expiry).toISOString() : null,
    oracle: p.oracle_id?.slice(0, 18),
  });
}
const s = JSON.parse(fs.readFileSync("data/veil-store.json", "utf8"));
const row = s.orders.find((r) => r.order.id === "182462e7ad59b713ce446745205cb853");
if (row) {
  console.log("sample order execution oracle:", row.execution?.oracleId);
  console.log("txDigests:", row.execution?.txDigests?.length, row.order?.txDigests?.length);
}
