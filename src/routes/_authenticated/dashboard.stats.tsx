import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, Lock } from "lucide-react";
import { DSCard, DSSectionTitle, DSSkeleton } from "@/components/DashboardShell";
import { useVeilData } from "@/lib/dashboard/veilStore";
import { useCockpitMode } from "@/lib/dashboard/ModeProvider";
import { dailyVolumeSeries, slippageSeries } from "@/lib/dashboard/stats";

export const Route = createFileRoute("/_authenticated/dashboard/stats")({
  head: () => ({ meta: [{ title: "Stats · Veil" }] }),
  component: StatsPage,
});

function StatsPage() {
  const { stats, orders, loading } = useVeilData();
  const { isPro } = useCockpitMode();
  const bars = dailyVolumeSeries(orders);
  const slip = slippageSeries(orders);

  const KPI = [
    { label: "Volume routed", value: stats.volume24h, sub: "24h" },
    { label: "Slippage saved", value: stats.slippageSaved, sub: "vs naive" },
    { label: "Proofs verified", value: String(stats.proofsPosted), sub: "your account" },
    { label: "Open positions", value: String(stats.openPositions), sub: "live" },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Stats</h1>
        <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
          Derived from your real enclave executions — no seed data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI.map((k) =>
          loading ? (
            <DSCard key={k.label}>
              <DSSkeleton className="h-3 w-24" />
              <DSSkeleton className="mt-3 h-8 w-32" />
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

      {isPro && !loading && (
        <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.15em]">
          <span className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1">
            spread · {stats.avgSpreadBps ?? 0} bps
          </span>
          <span className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1">
            slip · {stats.avgSlipBps ?? 0} bps
          </span>
          {stats.enclavePcr0 && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-400">
              PCR0 · {stats.enclavePcr0.slice(0, 12)}…
            </span>
          )}
        </div>
      )}

      <DSCard>
        <DSSectionTitle icon={BarChart3} title="Daily volume · your orders" />
        {loading ? (
          <DSSkeleton className="mt-6 h-48 w-full" />
        ) : bars.every((b) => b === 0) ? (
          <p className="mt-6 pb-20 text-center text-sm text-[color:var(--ds-muted)] md:pb-0">
            No volume yet — place your first order from the + button.
          </p>
        ) : (
          <div className="mt-6 flex h-48 items-end gap-2">
            {bars.map((b, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-amber-500/30 to-amber-400"
                style={{ height: `${Math.max(b, 4)}%` }}
              />
            ))}
          </div>
        )}
      </DSCard>

      <DSCard>
        <DSSectionTitle
          icon={isPro ? TrendingUp : Lock}
          title={isPro ? "Slippage vs naive · Pro" : "Slippage chart · Pro only"}
        />
        {!isPro ? (
          <p className="mt-6 pb-20 text-center text-sm text-[color:var(--ds-muted)] md:pb-0">
            Switch to <strong className="text-[color:var(--ds-fg)]">Pro</strong> in the header to
            see spread, slip, PCR0, and the slippage chart.
          </p>
        ) : loading ? (
          <DSSkeleton className="mt-6 h-32 w-full" />
        ) : (
          <div className="mt-6 h-32">
            <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="h-full w-full">
              <path
                d={slip
                  .map(
                    (b, i) =>
                      `${i === 0 ? "M" : "L"}${(i * (100 / (slip.length - 1))).toFixed(1)},${(36 - b * 0.3).toFixed(1)}`,
                  )
                  .join(" ")}
                stroke="#10b981"
                strokeWidth="0.8"
                fill="none"
              />
            </svg>
          </div>
        )}
      </DSCard>
    </div>
  );
}
