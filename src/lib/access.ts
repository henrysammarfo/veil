/** Public waitlist-only deploy vs full judge/local access. */

const JUDGE_KEY = "veil_judge_unlock";

export function isWaitlistOnlyMode(): boolean {
  return import.meta.env.VITE_WAITLIST_ONLY === "true";
}

export function isJudgeUnlocked(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(JUDGE_KEY) === "1";
}

export function tryUnlockJudge(code: string): boolean {
  const expected = import.meta.env.VITE_JUDGE_ACCESS_CODE;
  if (!expected || code.trim() !== expected) return false;
  sessionStorage.setItem(JUDGE_KEY, "1");
  return true;
}

export function canAccessDashboard(): boolean {
  if (!isWaitlistOnlyMode()) return true;
  return isJudgeUnlocked();
}

export function dashboardEntryPath(): string {
  if (isWaitlistOnlyMode() && !isJudgeUnlocked()) return "/waitlist";
  return "/auth";
}

export function dashboardPath(): string {
  if (isWaitlistOnlyMode() && !canAccessDashboard()) return "/waitlist";
  return "/dashboard";
}
