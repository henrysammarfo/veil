import { VEIL_CONFIG } from "./config";

export type UserPrefs = {
  theme?: "dark" | "light";
  cockpitMode?: "lite" | "pro";
  onboardingSteps?: Record<string, boolean>;
  onboardingDismissed?: boolean;
  archiveDensity?: "comfortable" | "compact";
  linkedWallet?: string;
  linkedEmail?: string;
  predictManagerId?: string;
};

export async function fetchPrefs(trader: string): Promise<UserPrefs> {
  if (!trader) return {};
  const res = await fetch(
    `${VEIL_CONFIG.apiUrl}/api/prefs?trader=${encodeURIComponent(trader)}`,
  );
  if (!res.ok) return {};
  return (await res.json()) as UserPrefs;
}

export async function savePrefs(trader: string, patch: Partial<UserPrefs>): Promise<UserPrefs> {
  if (!trader) return patch;
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/prefs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trader, ...patch }),
  });
  if (!res.ok) throw new Error(`Prefs save failed: ${res.status}`);
  return (await res.json()) as UserPrefs;
}

export async function fetchSponsorQuota(): Promise<{
  used: number;
  max: number;
  remaining: number;
}> {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/sponsor/quota`);
  if (!res.ok) return { used: 0, max: 1000, remaining: 1000 };
  return res.json() as Promise<{ used: number; max: number; remaining: number }>;
}
