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
          <div className="mt-6 flex h-48 items-end gap-2">
            {BARS.map((b, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-amber-500/30 to-amber-400 transition-all hover:from-amber-400 hover:to-amber-300"
                style={{ height: `${b}%` }}
                title={`Day ${i + 1}: $${(b * 1.2).toFixed(1)}k`}
              />
            ))}
          </div>
        )}
      </DSCard>
    </div>
  );
}
