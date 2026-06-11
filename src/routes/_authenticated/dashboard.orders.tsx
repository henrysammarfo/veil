import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, CircleDot, Plus, ArrowUpRight } from "lucide-react";
import { DSCard, DSEmpty, DSSectionTitle, DSSkeleton } from "@/components/DashboardShell";
import { useMockData, type OrderState } from "@/lib/dashboard/mockStore";

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  head: () => ({ meta: [{ title: "Orders · Veil" }] }),
  component: OrdersPage,
  errorComponent: ({ error, reset }) => (
    <div className="space-y-3 p-6 text-sm">
      <h2 className="font-display text-xl">Couldn't load orders</h2>
      <p className="text-[color:var(--ds-muted)]">{error.message}</p>
      <button onClick={reset} className="rounded-full border border-[color:var(--ds-border)] px-4 py-1.5 font-mono text-[11px] uppercase">retry</button>
    </div>
  ),
});

const FILTERS: Array<{ k: "ALL" | OrderState; label: string }> = [
  { k: "ALL", label: "All" },
  { k: "EXECUTING", label: "Live" },
  { k: "SETTLED", label: "Settled" },
  { k: "ACCRUING", label: "Earning" },
];

function statePill(s: OrderState) {
  if (s === "EXECUTING") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (s === "ACCRUING")  return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (s === "PENDING")   return "text-sky-400 bg-sky-500/10 border-sky-500/20";
  return "text-[color:var(--ds-muted)] bg-[color:var(--ds-pill)] border-[color:var(--ds-border)]";
}

function OrdersPage() {
  const { orders, loading } = useMockData();
  const [filter, setFilter] = useState<"ALL" | OrderState>("ALL");

  const list = useMemo(
    () => (filter === "ALL" ? orders : orders.filter((o) => o.state === filter)),
    [orders, filter],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Orders</h1>
          <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
            Every stealth-order intent you've handed to the enclave. Live slices
            tick in real time; settled orders keep their full receipt.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ds-accent)] px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[color:var(--ds-accent-fg)] transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      <DSCard>
        <DSSectionTitle
          icon={Activity}
          title={`${list.length} orders`}
          action={
            <div className="flex items-center gap-1 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-1 font-mono text-[10px] uppercase tracking-[0.15em]">
              {FILTERS.map((f) => (
                <button
                  key={f.k}
                  onClick={() => setFilter(f.k)}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    filter === f.k
                      ? "bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)]"
                      : "text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          }
        />

        {loading ? (
          <div className="mt-6 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-[color:var(--ds-border)] p-4">
                <DSSkeleton className="h-3 w-24" />
                <DSSkeleton className="mt-3 h-4 w-3/4" />
                <DSSkeleton className="mt-3 h-1 w-full" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <DSEmpty
            icon={Activity}
            title="Nothing here yet."
            body="No orders match this filter. Place a stealth order or relax the filter."
          />
        ) : (
          <ul className="mt-6 divide-y divide-[color:var(--ds-border)]">
            {list.map((o) => (
              <li key={o.id}>
                <Link
                  to="/dashboard/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-4 transition-colors hover:bg-[color:var(--ds-hover)] sm:grid-cols-[140px_minmax(0,1fr)_auto]"
                >
                  <div className="font-mono text-[11px]">
                    <div className="text-[color:var(--ds-fg)]">{o.id}</div>
                    <div className="mt-1 text-[color:var(--ds-muted)]">{o.asset}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em]">
                      <span className={`rounded border px-1.5 py-0.5 ${statePill(o.state)}`}>
                        <CircleDot className={`mr-1 inline h-2.5 w-2.5 ${o.state === "EXECUTING" ? "animate-pulse" : ""}`} />
                        {o.state}
                      </span>
                      <span className="rounded border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-1.5 py-0.5 text-[color:var(--ds-muted)]">
                        {o.mode}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm text-[color:var(--ds-fg)]">{o.intent}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1 max-w-[260px] flex-1 overflow-hidden rounded-full bg-[color:var(--ds-pill)]">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                          style={{ width: `${o.progress}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-[color:var(--ds-muted)]">
                        {o.slices.filled}/{o.slices.total}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[12px] text-emerald-400">
                    {o.pnl}
                    <ArrowUpRight className="ml-1 inline h-3 w-3 text-[color:var(--ds-muted)]" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DSCard>
    </div>
  );
}
