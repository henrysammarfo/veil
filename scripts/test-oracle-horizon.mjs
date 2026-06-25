import { fetchOracleForHorizon } from "../packages/sdk/src/predict-market.ts";

for (const hours of [15 / 60, 1, 24, 24 * 7]) {
  const o = await fetchOracleForHorizon(hours, "BTC");
  const ttl = o ? Math.round((o.expiry - Date.now()) / 60_000) : null;
  console.log(
    `intent ${hours < 1 ? Math.round(hours * 60) + "m" : hours + "h"} -> market ~${ttl}m oracle ${o?.oracleId?.slice(0, 18)}…`,
  );
}
