/** Client-side error hook for boundaries. Extend with Sentry etc. when needed. */
export function reportClientError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[Veil]", context, error);
}
