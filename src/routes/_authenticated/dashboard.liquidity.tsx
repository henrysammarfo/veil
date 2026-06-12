import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Droplets, Archive, ExternalLink, Rows3, Rows4 } from "lucide-react";
import { DSCard, DSSectionTitle, DSSkeleton } from "@/components/DashboardShell";
import { RefreshBar } from "@/components/dashboard/RefreshBar";
import { useMockData } from "@/lib/dashboard/mockStore";

export const Route = createFileRoute("/_authenticated/dashboard/liquidity")({
  head: () => ({ meta: [{ title: "Walrus Archive · Veil" }] }),
  component: LiquidityPage,
});

const POOLS = [
  { name: "USDC / BTC", depth: "$214k", spread: "6 bps", apr: "12.4%" },
  { name: "USDC / ETH", depth: "$182k", spread: "8 bps", apr: "9.8%" },
  { name: "USDC / SOL", depth: "$96k", spread: "11 bps", apr: "15.1%" },
];

const DENSITY_KEY = "veil.archive.density";
type Density = "comfortable" | "compact";

function LiquidityPage() {
  const { archive, loading } = useMockData();
  const [bootLoading, setBootLoading] = useState(true);
  const [density, setDensity] = useState<Density>("comfortable");

  useEffect(() => {
    try {
      const d = window.localStorage.getItem(DENSITY_KEY) as Density | null;
      if (d === "compact" || d === "comfortable") setDensity(d);
    } catch { /* ignore */ }
    const t = setTimeout(() => setBootLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  function pickDensity(d: Density) {
    setDensity(d);
    try { window.localStorage.setItem(DENSITY_KEY, d); } catch { /* ignore */ }
  }

  const showLoading = bootLoading || loading;
  const rowY = density === "compact" ? "py-1.5" : "py-3";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Walrus Archive</h1>
        <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
          The pools the router taps into, and the public Walrus archive where every
          daily report is sealed.
        </p>
      </div>

      <DSCard>
        <DSSectionTitle icon={Droplets} title="Routed Pools" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-5">
                  <DSSkeleton className="h-4 w-24" />
                  <DSSkeleton className="mt-3 h-6 w-20" />
                </div>
              ))
            : POOLS.map((p) => (
                <div
                  key={p.name}
                  className="rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-5 transition-colors hover:bg-[color:var(--ds-hover)]"
                >
                  <div className="font-mono text-[13px]">{p.name}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div>
                      <div className="text-[color:var(--ds-muted)]">depth</div>
                      <div className="mt-1">{p.depth}</div>
                    </div>
                    <div>
                      <div className="text-[color:var(--ds-muted)]">spread</div>
                      <div className="mt-1">{p.spread}</div>
                    </div>
                    <div>
                      <div className="text-[color:var(--ds-muted)]">apr</div>
                      <div className="mt-1 text-emerald-400">{p.apr}</div>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </DSCard>

      <DSCard>
        <DSSectionTitle
          icon={Archive}
          title="Daily Reports"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-1">
                <button
                  onClick={() => pickDensity("comfortable")}
                  aria-label="Comfortable density"
                  aria-pressed={density === "comfortable"}
                  className={`grid h-7 w-7 place-items-center rounded-full transition-colors ${
                    density === "comfortable"
                      ? "bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)]"
                      : "text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                  }`}
                >
                  <Rows3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => pickDensity("compact")}
                  aria-label="Compact density"
                  aria-pressed={density === "compact"}
                  className={`grid h-7 w-7 place-items-center rounded-full transition-colors ${
                    density === "compact"
                      ? "bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)]"
                      : "text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                  }`}
                >
                  <Rows4 className="h-3.5 w-3.5" />
                </button>
              </div>
              <RefreshBar resource="archive" label="archive" />
            </div>
          }
        />

        {showLoading ? (
          <div className="mt-6 space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <DSSkeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* desktop table */}
            <div className="mt-6 hidden md:block">
              <div className="grid grid-cols-12 gap-3 border-b border-[color:var(--ds-border)] pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                <span className="col-span-3">Date</span>
                <span className="col-span-4">Hash</span>
                <span className="col-span-2">Size</span>
                <span className="col-span-2">Proofs</span>
                <span className="col-span-1 text-right">Open</span>
              </div>
              <ul className="divide-y divide-[color:var(--ds-border)]">
                {archive.map((a) => (
                  <li
                    key={a.hash}
                    className={`grid grid-cols-12 items-center gap-3 font-mono text-[12px] transition-colors hover:bg-[color:var(--ds-hover)] ${rowY}`}
                  >
                    <span className="col-span-3">{a.date}</span>
                    <span className="col-span-4 truncate text-[color:var(--ds-muted)]">{a.hash}</span>
                    <span className="col-span-2 text-[color:var(--ds-muted)]">{a.size}</span>
                    <span className="col-span-2 text-emerald-400">{a.proofs}</span>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="col-span-1 flex justify-end text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                      aria-label={`Open report for ${a.date}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* mobile stacked cards */}
            <ul className="mt-5 grid gap-2 md:hidden">
              {archive.map((a) => (
                <li
                  key={a.hash}
                  className={`rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 ${density === "compact" ? "py-2" : "py-3"}`}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[12px]">{a.date}</div>
                      <div className="truncate font-mono text-[11px] text-[color:var(--ds-muted)]">{a.hash}</div>
                    </div>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-full border border-[color:var(--ds-border)] p-1.5 text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                      aria-label={`Open report for ${a.date}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  {density === "comfortable" && (
                    <div className="mt-2 flex items-center justify-between font-mono text-[11px]">
                      <span className="text-[color:var(--ds-muted)]">{a.size}</span>
                      <span className="text-emerald-400">{a.proofs} proofs</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </DSCard>

      <DSCard className="!py-4">
        <p className="text-[12px] text-[color:var(--ds-muted)]">
          Each daily report bundles every order, proof, and fill from that day. They live forever on{" "}
          <a href="https://walrus.site/veil" target="_blank" rel="noreferrer" className="underline">walrus.site/veil</a>.{" "}
          <Link to="/dashboard/proofs" className="underline">Browse the live proof stream →</Link>
        </p>
      </DSCard>
    </div>
  );
}
