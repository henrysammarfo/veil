/** DeepBook Predict testnet: only BTC markets are live for trading today. */
export const LIVE_MARKETS = ["BTC/USDC"] as const;

export type LiveMarket = (typeof LIVE_MARKETS)[number];

export function isLiveMarket(pair: string): boolean {
  return LIVE_MARKETS.includes(pair as LiveMarket);
}
