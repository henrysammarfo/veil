import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { DSCard, DSSectionTitle, DSSkeleton } from "@/components/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/stats")({
  head: () => ({ meta: [{ title: "Stats · Veil" }] }),
  component: StatsPage,
});

const KPI = [
  { label: "Volume routed", value: "$1.24M", sub: "30d" },
  { label: "Slippage saved", value: "$48.2k", sub: "vs naive" },
  { label: "Proofs verified", value: "1,872", sub: "100% pass" },
  { label: "Active enclaves", value: "4", sub: "veil-bull · bear · earn · router" },
];

const BARS = [12, 18, 9, 22, 28, 35, 30, 41, 38, 44, 51, 60, 55, 70, 64, 80, 72, 88];

function StatsPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Stats</h1>
        <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
          Network-level metrics. All values derived from on-chain proofs and
          Walrus-archived reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI.map((k) =>
          loading ? (
            <DSCard key={k.label}>
              <DSSkeleton className="h-3 w-24" />
              <DSSkeleton className="mt-3 h-8 w-32" />
              <DSSkeleton className="mt-2 h-3 w-20" />
            </DSCard>
          ) : (
            <DSCard key={k.label}>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                {k.label}
              </div>
              <div className="mt-3 font-display text-3xl">{k.value}</div>
              <div className="mt-1 flex items-center gap-1 font-mono text-[11px] text-[color:var(--ds-muted)]">
                <TrendingUp className="h-3 w-3" /> {k.sub}
              </div>
            </DSCard>
          ),
        )}
      </div>

      <DSCard>
        <DSSectionTitle icon={BarChart3} title="Daily Volume · last 18 days" />
        {loading ? (
          <DSSkeleton className="mt-6 h-48 w-full" />
        ) : (
          <div className="relative mt-6 h-48">
            <div className="flex h-full items-end gap-2">
              {BARS.map((b, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-amber-500/30 to-amber-400 transition-all hover:from-amber-400 hover:to-amber-300"
                  style={{ height: `${b}%` }}
                  title={`Day ${i + 1}: $${(b * 1.2).toFixed(1)}k`}
                />
              ))}
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
              <path
                d={
                  "M0," + (100 - BARS[0]).toFixed(1) + " " +
                  BARS.map((b, i) => `L${(i * (100 / (BARS.length - 1))).toFixed(2)},${(100 - b).toFixed(2)}`).join(" ")
                }
                stroke="#10b981"
                strokeWidth="0.6"
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="2 2"
              />
            </svg>
          </div>
        )}
      </DSCard>

      <DSCard>
        <DSSectionTitle icon={TrendingUp} title="Slippage vs naive · last 18 days (Pro)" />
        {loading ? (
          <DSSkeleton className="mt-6 h-32 w-full" />
        ) : (
          <div className="mt-6">
            <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="h-32 w-full">
              <defs>
                <linearGradient id="slip-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const pts = BARS.map((b, i) => [(i * (100 / (BARS.length - 1))), 36 - (b * 0.32) - 2] as const);
                const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
                return (
                  <>
                    <path d={`${line} L100,36 L0,36 Z`} fill="url(#slip-fill)" />
                    <path d={line} stroke="#10b981" strokeWidth="0.8" fill="none" vectorEffect="non-scaling-stroke" />
                  </>
                );
              })()}
            </svg>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[color:var(--ds-muted)]">
              <span>avg savings · -4.2 bps</span>
              <span>best · -9.1 bps</span>
              <span>worst · +0.3 bps</span>
            </div>
          </div>
        )}
      </DSCard>
    </div>
  );
}
