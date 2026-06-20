/** Rule-based plain-English intent parser — fallback when LLM unavailable. */

export type IntentMode = "BULL" | "BEAR" | "EARN" | "PARLAY";

export interface ParsedIntent {
  direction: "LONG" | "SHORT";
  asset: string;
  timeframeDays: number;
  convictionPct: number;
  mode: IntentMode;
  raw: string;
  source?: "rules" | "llm";
}

const ASSET_ALIASES: Record<string, string> = {
  bitcoin: "BTC",
  btc: "BTC",
  ethereum: "ETH",
  eth: "ETH",
  sol: "SOL",
  solana: "SOL",
  sui: "SUI",
};

const MODE_HINTS: { mode: IntentMode; pattern: RegExp }[] = [
  { mode: "PARLAY", pattern: /\b(parlay|combo|multi|legs?|both|and)\b/ },
  { mode: "EARN", pattern: /\b(earn|yield|compound|plp|idle|supply|vault)\b/ },
  { mode: "BEAR", pattern: /\b(bear|short|hedge|crash|drop|fall|distribute|sell)\b/ },
  { mode: "BULL", pattern: /\b(bull|long|rip|pump|accumulate|buy|up)\b/ },
];

export function classifyIntentRules(text: string): ParsedIntent {
  const lower = text.toLowerCase().trim();

  let mode: IntentMode = "BULL";
  for (const { mode: m, pattern } of MODE_HINTS) {
    if (pattern.test(lower)) {
      mode = m;
      break;
    }
  }

  const direction: "LONG" | "SHORT" =
    mode === "BEAR" || /\b(down|bear|crash|drop|fall|short|hedge)\b/.test(lower)
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
  if (/\btoday\b|\b24h\b|\b1d\b|\bone day\b/.test(lower)) timeframeDays = 1;
  if (/\b2 weeks?\b|\b14d\b/.test(lower)) timeframeDays = 14;
  if (/\bmonth\b|\b30d\b/.test(lower)) timeframeDays = 30;

  let convictionPct = 65;
  if (/\bvery\b|\bstrong\b|\bconfident\b|\bhigh conviction\b/.test(lower)) convictionPct = 78;
  if (/\bmaybe\b|\bunsure\b|\bcautious\b/.test(lower)) convictionPct = 52;

  return { direction, asset, timeframeDays, convictionPct, mode, raw: text, source: "rules" };
}

export function formatParsedIntent(p: ParsedIntent): string {
  const src = p.source === "llm" ? " · LLM" : "";
  return `${p.mode} · ${p.direction} · ${p.asset} · ${p.timeframeDays}d · ${p.convictionPct}%${src}`;
}
