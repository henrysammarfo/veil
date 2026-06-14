import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Landmark, Compass, CircleDot, TrendingUp, Plus } from "lucide-react";
import { DSCard, DSEmpty, DSSectionTitle, DSSkeleton } from "@/components/DashboardShell";
import { NewOrderDialog } from "@/components/dashboard/NewOrderDialog";
import { useMockData } from "@/lib/dashboard/mockStore";

export const Route = createFileRoute("/_authenticated/dashboard/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio · Veil" }] }),
  component: PortfolioPage,
});

// 30-point synthetic equity curve, deterministic per orders count so it feels alive
function curve(seed: number) {
  const pts: number[] = [];
  let v = 0.5;
  for (let i = 0; i < 30; i++) {
    v += (Math.sin(seed + i * 0.6) + Math.cos(seed * 0.31 + i * 0.27)) * 0.04;
    pts.push(Math.max(0.1, Math.min(1, v + 0.4)));
  }
  return pts;
}

function PortfolioPage() {
  const { orders, stats, loading } = useMockData();
  const [boot, setBoot] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBoot(false), 600);
    return () => clearTimeout(t);
  }, []);

  const open = useMemo(
    () => orders.filter((o) => o.state === "EXECUTING" || o.state === "ACCRUING"),
    [orders],
  );
  const settled = orders.length - open.length;
  const series = useMemo(() => curve(orders.length || 1), [orders.length]);
  const showLoading = boot || loading;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Portfolio</h1>
          <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
            Your live equity, deployed positions, and historical curve. Every
            number is derived from on-chain proofs.
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--ds-accent)] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[color:var(--ds-accent-fg)] transition-opacity hover:opacity-90 sm:px-5 sm:py-2.5"
        >
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      <DSCard>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
              Total balance
            </div>
            {showLoading ? (
              <DSSkeleton className="mt-3 h-12 w-56" />
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-display text-[clamp(2.5rem,4vw,3.75rem)] leading-none">
                  {stats.portfolioUsd}
                </span>
                <span className="rounded-md border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-2 py-1 font-mono text-[11px]">
                  USDC
                </span>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[12px]">
              <span className="text-emerald-400">+{stats.slippageSaved}</span>
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-emerald-400">slippage saved</span>
              <span className="text-[color:var(--ds-muted)]">vs naive market</span>
            </div>
          </div>
          {/* sparkline */}
          <svg viewBox="0 0 100 32" className="h-16 w-full max-w-xs">
            <defs>
              <linearGradient id="pg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={
                "M0," + (32 - series[0] * 28).toFixed(1) + " " +
                series.map((v, i) => `L${(i * (100 / (series.length - 1))).toFixed(2)},${(32 - v * 28).toFixed(2)}`).join(" ") +
                ` L100,32 L0,32 Z`
              }
              fill="url(#pg)"
            />
            <path
              d={
                "M0," + (32 - series[0] * 28).toFixed(1) + " " +
                series.map((v, i) => `L${(i * (100 / (series.length - 1))).toFixed(2)},${(32 - v * 28).toFixed(2)}`).join(" ")
              }
              stroke="#10b981"
              strokeWidth="1.2"
              fill="none"
            />
          </svg>
        </div>
      </DSCard>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Open positions", value: String(open.length) },
          { label: "Settled all-time", value: String(settled) },
          { label: "Volume · 24h", value: stats.volume24h, accent: true },
        ].map((s) =>
          showLoading ? (
            <DSCard key={s.label}>
              <DSSkeleton className="h-3 w-24" />
              <DSSkeleton className="mt-3 h-8 w-32" />
            </DSCard>
          ) : (
            <DSCard key={s.label}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
                {s.label}
              </div>
              <div className={`mt-3 font-display text-3xl ${s.accent ? "text-amber-400" : ""}`}>
                {s.value}
              </div>
              <div className="mt-2 flex items-center gap-1 font-mono text-[11px] text-[color:var(--ds-muted)]">
                <TrendingUp className="h-3 w-3" /> live · derived from proofs
              </div>
            </DSCard>
          ),
        )}
      </div>

      <DSCard>
        <DSSectionTitle icon={Landmark} title="Open positions" />
        {showLoading ? (
          <div className="mt-6 space-y-3">
            <DSSkeleton className="h-12 w-full" />
            <DSSkeleton className="h-12 w-full" />
          </div>
        ) : open.length === 0 ? (
          <DSEmpty
            icon={Landmark}
            title="No open positions yet."
            body="Place a stealth-order intent and your live slices will show up here as they fill."
            cta={
              <Link
                to="/dashboard/discover"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors hover:bg-[color:var(--ds-hover)]"
              >
                <Compass className="h-4 w-4" /> Discover leaders
              </Link>
            }
          />
        ) : (
          <ul className="mt-6 divide-y divide-[color:var(--ds-border)]">
            {open.map((o) => (
              <li key={o.id}>
                <Link
                  to="/dashboard/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4 transition-colors hover:bg-[color:var(--ds-hover)]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[color:var(--ds-muted)]">
                      <span>{o.id}</span>
                      <span>· {o.asset}</span>
                      <CircleDot className={`h-3 w-3 ${o.state === "EXECUTING" ? "animate-pulse text-emerald-400" : "text-amber-400"}`} />
                      <span>{o.state}</span>
                    </div>
                    <p className="mt-1.5 truncate text-sm">{o.intent}</p>
                    <div className="mt-2 h-1 max-w-md overflow-hidden rounded-full bg-[color:var(--ds-pill)]">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${o.progress}%` }} />
                    </div>
                  </div>
                  <div className="text-right font-mono text-[12px] text-emerald-400">{o.pnl}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DSCard>

      <NewOrderDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
