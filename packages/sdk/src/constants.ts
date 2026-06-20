/** dUSDC has 6 decimals on Predict testnet */
export const DUSDC_DECIMALS = 6;
export const DUSDC_SCALE = 10 ** DUSDC_DECIMALS;

/** Idle dUSDC kept in PredictManager for BULL/BEAR/PARLAY mint collateral (~74% of ~1900) */
export const MANAGER_MINT_RESERVE_USDC = Number(process.env.MANAGER_MINT_RESERVE_USDC ?? "1400");

/** Min supply / earn chunk (Predict + bible: 10 dUSDC) */
export const MIN_EARN_SUPPLY_USDC = Number(process.env.MIN_EARN_SUPPLY_USDC ?? "10");

/** Max single PLP supply per user/keeper tx — never dump full idle balance */
export const MAX_EARN_SUPPLY_USDC = Number(process.env.MAX_EARN_SUPPLY_USDC ?? "75");

/** Keeper drip per tick after redeem (reinvest yield sleeve only) */
export const KEEPER_DRIP_USDC = Number(process.env.KEEPER_DRIP_USDC ?? "25");

/** Oracle price feed max age (bible: 30s) */
export const ORACLE_MAX_STALE_MS = Number(process.env.ORACLE_MAX_STALE_MS ?? "30_000");

export function usdcToMicro(usdc: number): bigint {
  return BigInt(Math.round(usdc * DUSDC_SCALE));
}

export function microToUsdc(micro: bigint | number): number {
  return Number(micro) / DUSDC_SCALE;
}
