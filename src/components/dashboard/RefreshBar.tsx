import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useMockData, type ResourceKey } from "@/lib/dashboard/mockStore";

/**
 * Manual refresh button with a live "next update in Ns" countdown,
 * driven by the shared mock store's per-resource interval + last tick.
 */
export function RefreshBar({
  resource,
  label,
}: {
  resource: ResourceKey;
  label?: string;
}) {
  const { ticks, intervals, refresh, loading } = useMockData();
  const last = ticks[resource];
  const interval = intervals[resource];
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, Math.ceil((last + interval - now) / 1000));

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span className="hidden items-center gap-1.5 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[color:var(--ds-muted)] sm:inline-flex">
        <span className={`h-1.5 w-1.5 rounded-full ${loading ? "animate-pulse bg-amber-400" : "bg-emerald-400"}`} />
        {label ?? resource} · next {remaining}s
      </span>
      <span
        className="inline-flex items-center gap-1 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-2 py-1 font-mono text-[10px] text-[color:var(--ds-muted)] sm:hidden"
        aria-label={`${label ?? resource} next update in ${remaining}s`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${loading ? "animate-pulse bg-amber-400" : "bg-emerald-400"}`} />
        {remaining}s
      </span>
      <button
        onClick={() => refresh(resource)}
        disabled={loading}
        aria-label="Refresh"
        className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors hover:bg-[color:var(--ds-hover)] disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </div>
  );
}
