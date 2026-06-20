/** SVI parameters from DeepBook Predict OracleSVIUpdated events */
export interface SviParams {
  a: number;
  b: number;
  rho: number;
  m: number;
  sigma: number;
  t: number;
}

/** Standard normal CDF approximation (Abramowitz & Stegun) */
export function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1 + sign * y);
}

/**
 * Back-solve implied P(asset > strike at expiry) from SVI vol surface.
 * σ²(k) = a + b*(ρ*(k-m) + sqrt((k-m)²+σ²)) where k = ln(F/K)
 */
export function sviBackSolve(
  svi: SviParams,
  strike: number,
  forward: number,
  timeToExpiryYears: number,
): number {
  if (strike <= 0 || forward <= 0 || timeToExpiryYears <= 0) return 0.5;
  const k = Math.log(forward / strike);
  const km = k - svi.m;
  const inner = Math.sqrt(km * km + svi.sigma * svi.sigma);
  const sigmaK = Math.sqrt(Math.max(0, svi.a + svi.b * (svi.rho * km + inner)));
  const denom = sigmaK * Math.sqrt(timeToExpiryYears);
  if (denom === 0) return 0.5;
  const d1 = (Math.log(forward / strike) + 0.5 * sigmaK * sigmaK * timeToExpiryYears) / denom;
  return normalCdf(d1);
}

/** Oracle freshness — pause if feed lag exceeds threshold (bible: 30s) */
export function isOracleFresh(updatedAtMs: number, nowMs: number, maxLagMs = 30_000): boolean {
  return nowMs - updatedAtMs <= maxLagMs;
}
