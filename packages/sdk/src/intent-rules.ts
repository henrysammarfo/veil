/** Rule-based plain-English intent parser — fallback when LLM unavailable. */

export type IntentMode = "BULL" | "BEAR" | "EARN" | "PARLAY";
export type TimeframeUnit = "minutes" | "hours" | "days";

export interface ParsedIntent {
  direction: "LONG" | "SHORT";
  asset: string;
  /** Derived days (fractional ok) — kept for API backward compatibility */
  timeframeDays: number;
  timeframeValue: number;
  timeframeUnit: TimeframeUnit;
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

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  fifteen: 15,
  thirty: 30,
  sixty: 60,
};

export function timeframeToDays(value: number, unit: TimeframeUnit): number {
  if (unit === "minutes") return value / (24 * 60);
  if (unit === "hours") return value / 24;
  return value;
}

export function makeTimeframe(
  value: number,
  unit: TimeframeUnit,
): Pick<ParsedIntent, "timeframeValue" | "timeframeUnit" | "timeframeDays"> {
  const clamped =
    unit === "minutes"
      ? Math.min(120, Math.max(15, Math.round(value)))
      : unit === "hours"
        ? Math.min(72, Math.max(1, Math.round(value)))
        : Math.min(30, Math.max(1, Math.round(value)));
  return {
    timeframeValue: clamped,
    timeframeUnit: unit,
    timeframeDays: timeframeToDays(clamped, unit),
  };
}

export function parsedHorizonHours(p: ParsedIntent): number {
  if (p.timeframeUnit === "minutes") return Math.max(p.timeframeValue / 60, 1 / 60);
  if (p.timeframeUnit === "hours") return Math.max(1, p.timeframeValue);
  return Math.max(1, p.timeframeValue) * 24;
}

export function formatHorizon(p: Pick<ParsedIntent, "timeframeValue" | "timeframeUnit">): string {
  const v = p.timeframeValue;
  const u = p.timeframeUnit;
  if (u === "minutes") return `${v} min`;
  if (u === "hours") return v === 1 ? "1 hour" : `${v} hours`;
  return v === 1 ? "1 day" : `${v} days`;
}

function parseTimeframeRules(lower: string): Pick<ParsedIntent, "timeframeValue" | "timeframeUnit" | "timeframeDays"> {
  const minMatch = lower.match(/(\d+)\s*min(?:ute)?s?/);
  if (minMatch) return makeTimeframe(Number(minMatch[1]), "minutes");

  const hourMatch = lower.match(/(\d+)\s*h(?:ours?)?(?:\s|$|,|\.)/);
  if (hourMatch) return makeTimeframe(Number(hourMatch[1]), "hours");

  const dayMatch = lower.match(/(\d+)\s*days?/);
  if (dayMatch) return makeTimeframe(Number(dayMatch[1]), "days");

  for (const [word, num] of Object.entries(WORD_NUMBERS)) {
    if (new RegExp(`\\b${word}\\s+minutes?\\b`).test(lower)) {
      return makeTimeframe(num, "minutes");
    }
    if (new RegExp(`\\b${word}\\s+hours?\\b`).test(lower)) {
      return makeTimeframe(num, "hours");
    }
    if (new RegExp(`\\b${word}\\s+days?\\b`).test(lower)) {
      return makeTimeframe(num, "days");
    }
  }

  if (/\btoday\b|\b24h\b|\b1d\b|\bone day\b/.test(lower)) return makeTimeframe(1, "days");
  if (/\btomorrow\b/.test(lower)) return makeTimeframe(1, "days");
  if (/\bthis week\b|\bweek\b/.test(lower)) return makeTimeframe(7, "days");
  if (/\b2 weeks?\b|\b14d\b/.test(lower)) return makeTimeframe(14, "days");
  if (/\bmonth\b|\b30d\b/.test(lower)) return makeTimeframe(30, "days");

  return makeTimeframe(7, "days");
}

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

  const timeframe = parseTimeframeRules(lower);

  let convictionPct = 65;
  if (/\bvery\b|\bstrong\b|\bconfident\b|\bhigh conviction\b/.test(lower)) convictionPct = 78;
  if (/\bmaybe\b|\bunsure\b|\bcautious\b/.test(lower)) convictionPct = 52;

  return {
    direction,
    asset,
    ...timeframe,
    convictionPct,
    mode,
    raw: text,
    source: "rules",
  };
}

export function formatParsedIntent(p: ParsedIntent): string {
  const src = p.source === "llm" ? " · LLM" : "";
  return `${p.mode} · ${p.direction} · ${p.asset} · ${formatHorizon(p)} · ${p.convictionPct}%${src}`;
}
