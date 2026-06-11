import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Landmark, Compass } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DSCard, DSEmpty, DSSectionTitle, DSSkeleton } from "@/components/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio · Veil" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Portfolio</h1>

      <DSCard>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
              Total Balance
            </div>
            {loading ? (
              <DSSkeleton className="mt-3 h-12 w-56" />
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <span className="font-display text-[clamp(2.5rem,4vw,3.75rem)] leading-none">
                  $10,000
                </span>
                <span className="rounded-md border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-2 py-1 font-mono text-[11px]">
                  aUSD
                </span>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2 font-mono text-[12px]">
              <span className="text-emerald-400">+$0.00</span>
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-emerald-400">
                +0.0%
              </span>
              <span className="text-[color:var(--ds-muted)]">unrealized</span>
            </div>
          </div>
          <div className="h-16 w-72 overflow-hidden rounded-lg bg-emerald-500/10">
            <div className="h-full w-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500" />
          </div>
        </div>
      </DSCard>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Wallet Balance", value: "10,000 aUSD" },
          { label: "Deployed in Agents", value: "0 aUSD" },
          { label: "Active Agents", value: "0", accent: true },
        ].map((s) =>
          loading ? (
            <DSCard key={s.label}>
              <DSSkeleton className="h-3 w-24" />
              <DSSkeleton className="mt-3 h-8 w-32" />
            </DSCard>
          ) : (
            <DSCard key={s.label}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
                {s.label}
              </div>
              <div
                className={`mt-3 font-display text-3xl ${
                  s.accent ? "text-amber-400" : ""
                }`}
              >
                {s.value}
              </div>
            </DSCard>
          ),
        )}
      </div>

      <DSCard>
        <DSSectionTitle icon={Landmark} title="Open Positions" />
        {loading ? (
          <div className="mt-6 space-y-3">
            <DSSkeleton className="h-10 w-full" />
            <DSSkeleton className="h-10 w-full" />
          </div>
        ) : (
          <DSEmpty
            icon={Landmark}
            title="No open positions yet."
            body="Deploy an agent and wait for the leader's next move — your holdings will show up here."
            cta={
              <Link
                to="/dashboard/discover"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors hover:bg-[color:var(--ds-hover)]"
              >
                <Compass className="h-4 w-4" /> Discover Leaders
              </Link>
            }
          />
        )}
      </DSCard>
    </div>
  );
}
