import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Info,
  HelpCircle,
  ArrowUpRight,
  CircleDot,
  ShieldCheck,
} from "lucide-react";
import {
  DSCard,
  DSSectionTitle,
  DSSkeleton,
} from "@/components/DashboardShell";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { ProofConsole } from "@/components/dashboard/ProofConsole";
import { RefreshBar } from "@/components/dashboard/RefreshBar";
import { useAuth, shortAddress } from "@/lib/auth/AuthProvider";
import { useMockData } from "@/lib/dashboard/mockStore";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardOverview,
  errorComponent: ({ error, reset }) => (
    <div className="space-y-3 p-6 text-sm">
      <h2 className="font-display text-xl">Couldn't load the overview</h2>
      <p className="text-[color:var(--ds-muted)]">{error.message}</p>
      <button onClick={reset} className="rounded-full border border-[color:var(--ds-border)] px-4 py-1.5 font-mono text-[11px] uppercase">retry</button>
    </div>
  ),
});

function DashboardOverview() {
  const { user } = useAuth();
  const { orders, stats, loading } = useMockData();

  const live = orders.filter((o) => o.state === "EXECUTING" || o.state === "ACCRUING").slice(0, 3);

  const tiles = [
    { label: "VOLUME · 24H", value: stats.volume24h, sub: "+12.4% vs yesterday" },
    { label: "OPEN POSITIONS", value: String(stats.openPositions), sub: "Live + accruing" },
    { label: "SLIPPAGE SAVED", value: stats.slippageSaved, sub: "vs naive market" },
    { label: "PROOFS POSTED", value: String(stats.proofsPosted), sub: "100% verified" },
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      {/* HERO ROW */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
        <DSCard className="lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-[clamp(1.75rem,3.5vw,3rem)] leading-[1.05] tracking-tight">
                Welcome back.
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--ds-muted)]">
                Describe an intent — the enclave slices it into stealth orders,
                proves every fill on-chain, and seals the daily report to Walrus.
              </p>
            </div>
            <div className="flex -space-x-1">
              {["S", "$", "©", "T"].map((c, i) => (
                <span
                  key={i}
                  className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] text-[12px]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:mt-8 md:grid-cols-4">
            {tiles.map((s) =>
              loading ? (
                <div key={s.label} className="space-y-2">
                  <DSSkeleton className="h-3 w-20" />
                  <DSSkeleton className="h-7 w-16" />
                  <DSSkeleton className="h-3 w-24" />
                </div>
              ) : (
                <div key={s.label} className="min-w-0">
                  <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                    <span className="truncate">{s.label}</span>
                    <Info className="h-3 w-3 shrink-0 opacity-50" />
                  </div>
                  <div className="mt-2 font-display text-2xl md:text-3xl">{s.value}</div>
                  <div className="mt-1 truncate font-mono text-[11px] text-[color:var(--ds-muted)]">{s.sub}</div>
                </div>
              ),
            )}
          </div>
        </DSCard>

        <DSCard className="flex flex-col justify-between lg:col-span-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
              Portfolio Value
            </div>
            <span className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[color:var(--ds-muted)]">
              Live Equity
            </span>
          </div>
          {loading ? (
            <DSSkeleton className="mt-6 h-10 w-44" />
          ) : (
            <div className="mt-4">
              <div className="font-display text-[clamp(2rem,4.5vw,4rem)] leading-none">{stats.portfolioUsd}</div>
              <div className="mt-2 font-mono text-[12px]">
                <span className="text-emerald-400">+$0.00 (+0.0%)</span>{" "}
                <span className="text-[color:var(--ds-muted)]">Unrealized</span>
              </div>
            </div>
          )}
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[color:var(--ds-pill)] md:mt-8">
            <div className="h-full w-full bg-gradient-to-r from-amber-500/30 via-amber-400 to-amber-300" />
          </div>
        </DSCard>
      </div>

      {/* CHECKLIST */}
      <OnboardingChecklist />

      {/* MAIN GRID */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
        <DSCard className="lg:col-span-7">
          <DSSectionTitle
            icon={Activity}
            title="Active Orders"
            action={
              <div className="flex items-center gap-2">
                <RefreshBar resource="orders" label="orders" />
                <Link
                  to="/dashboard/orders"
                  className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)] sm:inline"
                >
                  View all →
                </Link>
              </div>
            }
          />
          {loading ? (
            <ul className="mt-6 space-y-5">
              {[0, 1, 2].map((i) => (
                <li key={i} className="space-y-3 border-t border-[color:var(--ds-border)] pt-5">
                  <DSSkeleton className="h-3 w-32" />
                  <DSSkeleton className="h-4 w-3/4" />
                  <DSSkeleton className="h-1 w-full" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-5 divide-y divide-[color:var(--ds-border)] md:mt-6">
              {live.map((o) => (
                <li key={o.id} className="py-4">
                  <Link to="/dashboard/orders/$orderId" params={{ orderId: o.id }} className="block">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[color:var(--ds-muted)]">
                          <span>{o.id}</span>
                          <span className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-2 py-0.5 text-[color:var(--ds-fg)]">
                            {o.mode}
                          </span>
                          <span className="flex items-center gap-1">
                            <CircleDot className={`h-3 w-3 ${o.state === "EXECUTING" ? "animate-pulse text-emerald-400" : "text-amber-400"}`} />
                            {o.state}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-[14px] text-[color:var(--ds-fg)]">{o.intent}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[11px] text-[color:var(--ds-muted)]">{o.slices.filled}/{o.slices.total}</div>
                        <div className="mt-1 font-mono text-[12px] text-emerald-400">{o.pnl}</div>
                      </div>
                    </div>
                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[color:var(--ds-pill)]">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500" style={{ width: `${o.progress}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DSCard>

        <DSCard className="lg:col-span-5">
          <DSSectionTitle
            icon={ShieldCheck}
            title="Proof Console"
            action={
              <Link to="/dashboard/proofs" className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 hover:opacity-80">
                ● live
              </Link>
            }
          />
          <div className="mt-4">
            <ProofConsole max={10} showFilters={false} showSearch={false} />
          </div>
        </DSCard>
      </div>

      {/* HELP STRIP */}
      <DSCard className="!py-3 md:!py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-[color:var(--ds-muted)]">
          <span className="flex min-w-0 items-center gap-2">
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Mock data, live-ready. Wallet {user && shortAddress(user.address)}.</span>
          </span>
          <Link to="/dashboard/profile" className="inline-flex items-center gap-1 uppercase tracking-[0.2em] hover:text-[color:var(--ds-fg)]">
            View profile <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </DSCard>
    </div>
  );
}
