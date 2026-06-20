const MAX_KELLY_FRACTION = 0.25;

/**
 * Kelly criterion: f* = (p*b - q) / b
 * @param conviction User probability estimate (0-1)
 * @param impliedProb Market implied probability (0-1)
 * @param balance Account balance in USDC
 * @param oddsMultiplier b = payout odds minus 1
 */
export function kellySize(
  conviction: number,
  impliedProb: number,
  balance: number,
  oddsMultiplier: number,
  maxPosition?: number,
): number {
  const p = conviction;
  const q = 1 - p;
  const b = oddsMultiplier;
  if (b <= 0) return 0;
  const f = (p * b - q) / b;
  if (f <= 0 || conviction <= impliedProb) return 0;
  const capped = Math.min(f, MAX_KELLY_FRACTION);
  const stake = balance * capped;
  if (maxPosition !== undefined) return Math.min(stake, maxPosition);
  return stake;
}

/** Parlay Kelly: f = (p_user - p_market) / (1 - p_market) */
export function kellyParlaySize(
  userConviction: number,
  marketProb: number,
  balance: number,
  maxPosition?: number,
): number {
  if (marketProb >= 1 || userConviction <= marketProb) return 0;
  const f = (userConviction - marketProb) / (1 - marketProb);
  const capped = Math.min(Math.max(f, 0), MAX_KELLY_FRACTION);
  const stake = balance * capped;
  if (maxPosition !== undefined) return Math.min(stake, maxPosition);
  return stake;
}

export function kellyFraction(conviction: number, oddsMultiplier: number): number {
  const p = conviction;
  const q = 1 - p;
  const b = oddsMultiplier;
  if (b <= 0) return 0;
  const f = (p * b - q) / b;
  return Math.max(0, Math.min(f, MAX_KELLY_FRACTION));
}
