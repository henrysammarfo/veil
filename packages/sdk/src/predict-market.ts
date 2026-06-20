/** Resolve live DeepBook Predict oracle + manager IDs from predict-server (docs.sui.io). */
import { PREDICT_TESTNET } from "./config/testnet.js";
import type { OracleSviState } from "./types.js";
import { ORACLE_MAX_STALE_MS } from "./constants.js";

export interface PredictOracleInfo {
  oracleId: string;
  expiry: number;
  minStrike: number;
  tickSize: number;
  underlyingAsset: string;
  status: string;
}

export interface PredictLiveConfig {
  managerId: string;
  oracleId: string;
  oracleExpiry: number;
  defaultStrike: number;
}

type OracleRow = {
  oracle_id: string;
  expiry: number;
  min_strike: number;
  tick_size: number;
  underlying_asset: string;
  status: string;
};

type ManagerRow = { manager_id: string; owner: string };

const BASE = PREDICT_TESTNET.serverUrl;
/** Predict oracle spot/forward/strike fixed-point scale (on-chain 1e9). */
export const PREDICT_PRICE_SCALE = 1_000_000_000;
const SVI_SCALAR = 1e8;

export function predictPriceToUsd(fixed: number): number {
  return fixed / PREDICT_PRICE_SCALE;
}

export function parseOracleSvi(
  state: Record<string, unknown>,
  expiryMs: number,
): OracleSviState | null {
  const raw = state.latest_svi as Record<string, unknown> | undefined;
  if (!raw || raw.a === undefined) return null;
  const rhoMag = Number(raw.rho) / SVI_SCALAR;
  const years = Math.max(1 / (365 * 24), (expiryMs - Date.now()) / (365 * 24 * 3600 * 1000));
  return {
    a: Number(raw.a) / SVI_SCALAR,
    b: Number(raw.b) / SVI_SCALAR,
    rho: raw.rho_negative ? -Math.abs(rhoMag) : rhoMag,
    m: (Number(raw.m) / SVI_SCALAR) * (raw.m_negative ? -1 : 1),
    sigma: Number(raw.sigma) / SVI_SCALAR,
    t: years,
    updatedAtMs: Number(
      (state.latest_price as { checkpoint_timestamp_ms?: number } | undefined)
        ?.checkpoint_timestamp_ms ?? Date.now(),
    ),
  };
}

export interface LiveMarketContext {
  oracleId: string;
  forwardUsd: number;
  forwardFixed: number;
  svi: OracleSviState;
  meta: PredictOracleInfo;
}

/** Live forward + SVI from predict-server — throws if oracle inactive. */
export async function fetchLiveMarketContext(oracleId: string): Promise<LiveMarketContext> {
  const res = await fetch(`${BASE}/oracles/${oracleId}/state`);
  if (!res.ok) throw new Error(`predict-server oracle state ${res.status}`);
  const data = (await res.json()) as {
    oracle?: OracleRow;
    latest_price?: { forward?: number; spot?: number };
    latest_svi?: Record<string, unknown>;
  };
  const o = data.oracle;
  if (!o || o.status !== "active") throw new Error("oracle inactive or missing");
  const forwardFixed = data.latest_price?.forward ?? data.latest_price?.spot;
  if (!forwardFixed) throw new Error("oracle forward price unavailable");
  const svi = parseOracleSvi(
    {
      latest_svi: data.latest_svi,
      latest_price: data.latest_price,
    },
    o.expiry,
  );
  if (!svi) throw new Error("oracle SVI unavailable");
  const meta: PredictOracleInfo = {
    oracleId: o.oracle_id,
    expiry: o.expiry,
    minStrike: o.min_strike,
    tickSize: o.tick_size,
    underlyingAsset: o.underlying_asset,
    status: o.status,
  };
  return {
    oracleId,
    forwardUsd: predictPriceToUsd(forwardFixed),
    forwardFixed,
    svi,
    meta,
  };
}

export async function fetchVaultUtilizationPct(): Promise<number> {
  const res = await fetch(
    `${BASE}/predicts/${PREDICT_TESTNET.predictObjectId}/vault/summary`,
  );
  if (!res.ok) throw new Error(`vault summary ${res.status}`);
  const data = (await res.json()) as { utilization_pct?: number; utilization?: number };
  return Number(data.utilization_pct ?? data.utilization ?? 0);
}

/** BTC spot/forward on Predict testnet uses 1e9 fixed-point (see oracle `spot` field). */
export function usdToPredictStrike(usd: number): number {
  return Math.round(usd * 1_000_000_000);
}

export async function fetchActiveOracle(asset = "BTC"): Promise<PredictOracleInfo | null> {
  const res = await fetch(`${BASE}/predicts/${PREDICT_TESTNET.predictObjectId}/oracles`);
  if (!res.ok) return null;
  const rows = (await res.json()) as OracleRow[];
  const now = Date.now();
  const active = rows
    .filter((o) => o.status === "active" && o.underlying_asset === asset && o.expiry > now)
    .sort((a, b) => b.expiry - a.expiry);
  const pick = active[0];
  if (!pick) return null;
  return {
    oracleId: pick.oracle_id,
    expiry: pick.expiry,
    minStrike: pick.min_strike,
    tickSize: pick.tick_size,
    underlyingAsset: pick.underlying_asset,
    status: pick.status,
  };
}

export async function fetchManagerForOwner(owner: string): Promise<string | null> {
  const res = await fetch(`${BASE}/managers?owner=${owner}`);
  if (!res.ok) return null;
  const rows = (await res.json()) as ManagerRow[];
  return rows[0]?.manager_id ?? null;
}

/** Snap a raw strike onto the oracle tick grid. */
export function snapStrikeToGrid(strike: number, minStrike: number, tickSize: number): number {
  if (tickSize <= 0) return strike;
  const delta = strike - minStrike;
  const ticks = Math.max(0, Math.round(delta / tickSize));
  return minStrike + ticks * tickSize;
}

export async function fetchOracleMeta(oracleId: string): Promise<PredictOracleInfo | null> {
  const res = await fetch(`${BASE}/oracles/${oracleId}/state`);
  if (!res.ok) return null;
  const data = (await res.json()) as { oracle?: OracleRow };
  const o = data.oracle;
  if (!o) return null;
  return {
    oracleId: o.oracle_id,
    expiry: o.expiry,
    minStrike: o.min_strike,
    tickSize: o.tick_size,
    underlyingAsset: o.underlying_asset,
    status: o.status,
  };
}

/** Resolve mint strike: user USD target snapped to grid; ATM fallback if too far from forward. */
export async function resolveMintStrike(
  oracleId: string,
  strikeUsd: number,
): Promise<{ strike: number; expiry: number; usedAtm: boolean } | null> {
  const meta = await fetchOracleMeta(oracleId);
  if (!meta || meta.status !== "active") return null;

  const forward = await fetchOracleForward(oracleId);
  let raw = usdToPredictStrike(strikeUsd);
  let usedAtm = false;
  // Deep OTM strikes often fail assert_mintable_ask — mint ATM when far from forward.
  if (forward && forward > 0) {
    const drift = Math.abs(raw - forward) / forward;
    if (drift > 0.15) {
      raw = forward;
      usedAtm = true;
    }
  }

  const strike = snapStrikeToGrid(raw, meta.minStrike, meta.tickSize);
  return { strike, expiry: meta.expiry, usedAtm };
}

export async function fetchOracleForward(oracleId: string): Promise<number | null> {
  const res = await fetch(`${BASE}/oracles/${oracleId}/state`);
  if (!res.ok) return null;
  const data = (await res.json()) as { latest_price?: { forward?: number } };
  return data.latest_price?.forward ?? null;
}

export interface ManagerSummary {
  managerId: string;
  balanceMicro: bigint;
  openPositions: number;
  awaitingSettlement: number;
}

export interface ManagerPositionRow {
  oracleId: string;
  expiry: number;
  strike: number;
  isUp: boolean;
  openQuantity: number;
  status: string;
  redeemableUsdc: number;
}

export async function fetchManagerSummary(managerId: string): Promise<ManagerSummary | null> {
  const res = await fetch(`${BASE}/managers/${managerId}/summary`);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    manager_id: string;
    balances?: { balance: number }[];
    open_positions?: number;
    awaiting_settlement_positions?: number;
    trading_balance?: number;
  };
  const bal = data.balances?.[0]?.balance ?? data.trading_balance ?? 0;
  return {
    managerId: data.manager_id,
    balanceMicro: BigInt(bal),
    openPositions: data.open_positions ?? 0,
    awaitingSettlement: data.awaiting_settlement_positions ?? 0,
  };
}

export async function fetchManagerPositions(managerId: string): Promise<ManagerPositionRow[]> {
  const res = await fetch(`${BASE}/managers/${managerId}/positions/summary`);
  if (!res.ok) return [];
  const rows = (await res.json()) as {
    oracle_id: string;
    expiry: number;
    strike: number;
    is_up: boolean;
    open_quantity: number;
    status: string;
    redeemable_value?: number;
  }[];
  return rows.map((r) => ({
    oracleId: r.oracle_id,
    expiry: r.expiry,
    strike: r.strike,
    isUp: r.is_up,
    openQuantity: r.open_quantity,
    status: r.status,
    redeemableUsdc: (r.redeemable_value ?? 0) / 1_000_000,
  }));
}

/** Bible: pause execution when oracle feed is stale. */
export function assertOracleFresh(live: LiveMarketContext, maxLagMs = ORACLE_MAX_STALE_MS): void {
  const lag = Date.now() - live.svi.updatedAtMs;
  if (lag > maxLagMs) {
    throw new Error(`oracle feed stale (${lag}ms > ${maxLagMs}ms)`);
  }
}
