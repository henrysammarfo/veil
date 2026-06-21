import {
  classifyIntentRules,
  formatHorizon,
  formatParsedIntent,
  makeTimeframe,
  parsedHorizonHours,
  type ParsedIntent,
  type IntentMode,
  type TimeframeUnit,
} from "./intent-rules.js";

const SYSTEM_PROMPT = `You parse trading intents for Veil (DeepBook Predict stealth execution).
Return ONLY valid JSON with keys:
- mode: "BULL" | "BEAR" | "EARN" | "PARLAY"
- direction: "LONG" | "SHORT"
- asset: "BTC" | "ETH" | "SOL" | "SUI"
- timeframeValue: integer — the number from the user's intent (e.g. 2 for "two days", 15 for "15m")
- timeframeUnit: "minutes" | "hours" | "days" — match exactly what the user asked for
- convictionPct: integer 40-90
- rationale: one short sentence

Rules:
- "15m BTC long" → timeframeValue 15, timeframeUnit "minutes"
- "go long BTC in 2 days" → timeframeValue 2, timeframeUnit "days"
- "quick scalp" with no duration → timeframeValue 15, timeframeUnit "minutes"
- "next 4 hours" → timeframeValue 4, timeframeUnit "hours"
- "this week" → timeframeValue 7, timeframeUnit "days"
- BULL = directional up. BEAR = hedge/distribute. EARN = yield on idle USDC. PARLAY = multi-leg combo.`;

function normalizeLlmJson(raw: Record<string, unknown>, text: string): ParsedIntent {
  const modes = new Set(["BULL", "BEAR", "EARN", "PARLAY"]);
  const assets = new Set(["BTC", "ETH", "SOL", "SUI"]);
  const units = new Set(["minutes", "hours", "days"]);
  const mode = modes.has(String(raw.mode)) ? (String(raw.mode) as IntentMode) : "BULL";
  const asset = assets.has(String(raw.asset).toUpperCase())
    ? String(raw.asset).toUpperCase()
    : "BTC";
  const direction = raw.direction === "SHORT" ? "SHORT" : "LONG";
  const convictionPct = Math.min(90, Math.max(40, Math.round(Number(raw.convictionPct) || 65)));

  const unitRaw = String(raw.timeframeUnit ?? "").toLowerCase();
  let unit: TimeframeUnit = units.has(unitRaw) ? (unitRaw as TimeframeUnit) : "minutes";
  let value = Math.round(Number(raw.timeframeValue) || 0);

  if (!value && raw.timeframeDays != null) {
    value = Math.round(Number(raw.timeframeDays) || 7);
    unit = "days";
  }
  if (!value) {
    value = 15;
    unit = "minutes";
  }

  const timeframe = makeTimeframe(value, unit);

  return {
    mode,
    direction,
    asset,
    ...timeframe,
    convictionPct,
    raw: text,
    source: "llm",
  };
}

/** Parse plain-English intent via OpenAI-compatible chat API (runs in API or enclave). */
export async function parseIntentWithLlm(
  text: string,
  opts?: { apiKey?: string; model?: string; baseUrl?: string },
): Promise<ParsedIntent> {
  const trimmed = text.trim();
  if (!trimmed) return classifyIntentRules(text);

  const apiKey = opts?.apiKey ?? process.env.OPENAI_API_KEY ?? process.env.VEIL_LLM_API_KEY;
  if (!apiKey) return classifyIntentRules(trimmed);

  const model = opts?.model ?? process.env.VEIL_LLM_MODEL ?? "gpt-4o-mini";
  const baseUrl = (opts?.baseUrl ?? process.env.VEIL_LLM_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: trimmed },
        ],
      }),
    });
    if (!res.ok) {
      console.warn("LLM intent parse failed:", res.status, await res.text().catch(() => ""));
      return classifyIntentRules(trimmed);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return classifyIntentRules(trimmed);
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return normalizeLlmJson(parsed, trimmed);
  } catch (e) {
    console.warn("LLM intent error:", e instanceof Error ? e.message : e);
    return classifyIntentRules(trimmed);
  }
}

export { classifyIntentRules, formatParsedIntent, formatHorizon, parsedHorizonHours, makeTimeframe };
export type { ParsedIntent, IntentMode, TimeframeUnit };
