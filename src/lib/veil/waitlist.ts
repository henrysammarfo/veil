import { VEIL_CONFIG } from "./config";

export type WaitlistExperience = "new" | "trader" | "power";

export interface WaitlistInput {
  email: string;
  wallet?: string;
  experience: WaitlistExperience;
}

export async function joinWaitlist(input: WaitlistInput): Promise<void> {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Waitlist failed: ${res.status}`);
  }
}

export async function fetchWaitlistCount(): Promise<number> {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/waitlist/count`);
  if (!res.ok) return 0;
  const data = (await res.json()) as { count: number };
  return data.count;
}
