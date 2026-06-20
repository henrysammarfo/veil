/** Public waitlist-only deploy vs full reviewer app (DeepSurge link). */

export function isWaitlistOnlyMode(): boolean {
  return import.meta.env.VITE_WAITLIST_ONLY === "true";
}

/** Reviewer app URL — set on waitlist Vercel deploy so public site can point judges to the right place. */
export function reviewerAppUrl(): string {
  return (import.meta.env.VITE_REVIEWER_APP_URL ?? "").trim();
}

export function canAccessDashboard(): boolean {
  return !isWaitlistOnlyMode();
}

export function dashboardEntryPath(): string {
  if (isWaitlistOnlyMode()) return "/waitlist";
  return "/auth";
}

export function dashboardPath(): string {
  if (isWaitlistOnlyMode()) return "/waitlist";
  return "/dashboard";
}

/** Navbar primary button on marketing pages */
export function headerCtaLabel(isAuthenticated: boolean): string {
  if (isAuthenticated && canAccessDashboard()) return "DASHBOARD";
  if (isWaitlistOnlyMode()) return "JOIN WAITLIST";
  return "BEGIN JOURNEY";
}

export function headerCtaPath(isAuthenticated: boolean): string {
  if (isAuthenticated && canAccessDashboard()) return dashboardPath();
  return dashboardEntryPath();
}

/** In-page CTAs (Studio footer, landing sections) */
export function marketingActionLabel(): string {
  if (canAccessDashboard()) return "OPEN DASHBOARD";
  if (isWaitlistOnlyMode()) return "JOIN WAITLIST";
  return "BEGIN JOURNEY";
}

export function marketingActionPath(): string {
  return dashboardEntryPath();
}
