import { VEIL_CONFIG } from "./config";
import {
  classifyIntentRules,
  formatParsedIntent,
  type ParsedIntent,
} from "../../../packages/sdk/src/intent-rules";

export type { ParsedIntent };
export { formatParsedIntent, classifyIntentRules as classifyIntent };

/** Parse intent via API → enclave LLM (falls back to rules if no API key). */
export async function parseIntent(text: string): Promise<ParsedIntent> {
  const trimmed = text.trim();
  if (!trimmed) return classifyIntentRules(text);

  try {
    const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/intent/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    if (res.ok) return (await res.json()) as ParsedIntent;
  } catch {
    /* offline dev */
  }
  return classifyIntentRules(trimmed);
}
