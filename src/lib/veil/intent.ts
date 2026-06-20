export interface ParsedIntent {
  direction: "LONG" | "SHORT";
  asset: string;
  timeframeDays: number;
  convictionPct: number;
  raw: string;
}

const ASSET_ALIASES: Record<string, string> = {
  bitcoin: "BTC",
  btc: "BTC",
  ethereum: "ETH",
  eth: "ETH",
  sol: "SOL",
  solana: "SOL",
};

/** Lightweight noob-mode intent classifier (production: LLM via API) */
export function classifyIntent(text: string): ParsedIntent {
  const lower = text.toLowerCase();
  const direction: "LONG" | "SHORT" = /\b(down|bear|crash|drop|fall)\b/.test(lower)
    ? "SHORT"
    : "LONG";

  let asset = "BTC";
  for (const [key, sym] of Object.entries(ASSET_ALIASES)) {
    if (lower.includes(key)) {
      asset = sym;
      break;
    }
  }

  let timeframeDays = 7;
  if (/\btoday\b|\b24h\b|\bday\b/.test(lower)) timeframeDays = 1;
  if (/\bmonth\b/.test(lower)) timeframeDays = 30;

  let convictionPct = 60;
  if (/\bvery\b|\bstrong\b|\bconfident\b/.test(lower)) convictionPct = 75;
  if (/\bmaybe\b|\bunsure\b/.test(lower)) convictionPct = 52;

  return { direction, asset, timeframeDays, convictionPct, raw: text };
}
