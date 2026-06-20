export interface ArbResult {
  arbDetected: boolean;
  gapPct: number;
  direction: "deepbook_cheap" | "polymarket_cheap" | "none";
}

export function detectArbitrage(
  deepbookProb: number,
  polymarketProb: number,
  threshold = 0.1,
): ArbResult {
  const gap = polymarketProb - deepbookProb;
  const gapPct = Math.abs(gap) * 100;
  if (gapPct < threshold * 100) {
    return { arbDetected: false, gapPct, direction: "none" };
  }
  return {
    arbDetected: true,
    gapPct,
    direction: gap > 0 ? "deepbook_cheap" : "polymarket_cheap",
  };
}

export interface PolymarketMarket {
  slug?: string;
  outcomePrices?: string;
  lastTradePrice?: number;
  question?: string;
}

/** Fetch implied probability from Polymarket gamma API (public, no key). */
export async function fetchPolymarketProb(
  asset: string,
  strikePrice: number,
  _expiryDate: string,
  fetchFn: typeof fetch = fetch,
): Promise<number | null> {
  const slug = `${asset.toLowerCase()}-above-${strikePrice}`;
  const url = `https://gamma-api.polymarket.com/markets?slug=${encodeURIComponent(slug)}`;
  try {
    const res = await fetchFn(url);
    if (!res.ok) return null;
    const markets = (await res.json()) as PolymarketMarket[];
    const m = markets[0];
    if (!m) return null;
    if (typeof m.lastTradePrice === "number") return m.lastTradePrice;
    if (m.outcomePrices) {
      const prices = JSON.parse(m.outcomePrices) as string[];
      if (prices[0]) return parseFloat(prices[0]);
    }
    return null;
  } catch {
    return null;
  }
}
