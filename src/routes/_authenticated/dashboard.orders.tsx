import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, CircleDot, Plus, ArrowUpRight, Search, X } from "lucide-react";
import { DSCard, DSEmpty, DSSectionTitle, DSSkeleton } from "@/components/DashboardShell";
import { RefreshBar } from "@/components/dashboard/RefreshBar";
import { NewOrderDialog } from "@/components/dashboard/NewOrderDialog";
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

type StatusFilter = "ALL" | OrderState;
type RangeFilter = "ALL" | "24H" | "7D" | "30D";
type SortKey = "NEWEST" | "OLDEST" | "PROGRESS" | "PNL";

const STATUS: Array<{ k: StatusFilter; label: string }> = [
  { k: "ALL", label: "All" },
  { k: "EXECUTING", label: "Live" },
  { k: "SETTLED", label: "Settled" },
  { k: "ACCRUING", label: "Earning" },
  { k: "PENDING", label: "Pending" },
];

const RANGES: Array<{ k: RangeFilter; label: string; ms: number | null }> = [
  { k: "ALL", label: "All time", ms: null },
  { k: "24H", label: "24h", ms: 86_400_000 },
  { k: "7D", label: "7d", ms: 7 * 86_400_000 },
  { k: "30D", label: "30d", ms: 30 * 86_400_000 },
];

function statePill(s: OrderState) {
  if (s === "EXECUTING") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (s === "ACCRUING")  return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (s === "PENDING")   return "text-sky-400 bg-sky-500/10 border-sky-500/20";
  return "text-[color:var(--ds-muted)] bg-[color:var(--ds-pill)] border-[color:var(--ds-border)]";
}

function parsePnl(p: string): number {
  const m = p.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) * (p.includes("-") ? -1 : 1) : 0;
}

function OrdersPage() {
  const { orders, loading, wallets } = useMockData();
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [range, setRange] = useState<RangeFilter>("ALL");
  const [wallet, setWallet] = useState<string>("ALL");
  const [sort, setSort] = useState<SortKey>("NEWEST");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const list = useMemo(() => {
    const now = Date.now();
    const rangeMs = RANGES.find((r) => r.k === range)?.ms ?? null;
    const q = query.trim().toLowerCase();
    let out = orders.filter((o) => {
      if (status !== "ALL" && o.state !== status) return false;
      if (rangeMs && now - o.createdAt > rangeMs) return false;
      if (wallet !== "ALL" && o.wallet !== wallet) return false;
      if (q && !(o.intent.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.asset.toLowerCase().includes(q))) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      switch (sort) {
        case "OLDEST": return a.createdAt - b.createdAt;
        case "PROGRESS": return b.progress - a.progress;
        case "PNL": return parsePnl(b.pnl) - parsePnl(a.pnl);
        default: return b.createdAt - a.createdAt;
      }
    });
    return out;
  }, [orders, status, range, wallet, query, sort]);

  const anyFilter = status !== "ALL" || range !== "ALL" || wallet !== "ALL" || query.length > 0;

  function clearAll() {
    setStatus("ALL"); setRange("ALL"); setWallet("ALL"); setQuery("");
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Orders</h1>
          <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
            Every stealth-order intent you've handed to the enclave. Live slices
            tick in real time; settled orders keep their full receipt.
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
        <DSSectionTitle
          icon={Activity}
          title={`${list.length} orders`}
          action={<RefreshBar resource="orders" label="orders" />}
        />

        {/* Filter rail */}
        <div className="mt-5 space-y-3">
          <div className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-1 font-mono text-[10px] uppercase tracking-[0.15em] sm:w-fit">
            {STATUS.map((f) => (
              <button
                key={f.k}
                onClick={() => setStatus(f.k)}
                className={`shrink-0 rounded-full px-3 py-1 transition-colors ${
                  status === f.k
                    ? "bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)]"
                    : "text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-1 font-mono text-[10px] uppercase tracking-[0.15em]">
              {RANGES.map((r) => (
                <button
                  key={r.k}
                  onClick={() => setRange(r.k)}
                  className={`shrink-0 rounded-full px-3 py-1 transition-colors ${
                    range === r.k
                      ? "bg-[color:var(--ds-fg)] text-[color:var(--ds-bg)]"
                      : "text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <select
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1.5 font-mono text-[11px] text-[color:var(--ds-fg)] outline-none"
            >
              <option value="ALL">All wallets</option>
              {wallets.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1.5 font-mono text-[11px] text-[color:var(--ds-fg)] outline-none"
            >
              <option value="NEWEST">Sort · Newest</option>
              <option value="OLDEST">Sort · Oldest</option>
              <option value="PROGRESS">Sort · Progress</option>
              <option value="PNL">Sort · P&amp;L</option>
            </select>

            <div className="ml-auto flex min-w-[160px] items-center gap-2 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1.5">
              <Search className="h-3 w-3 text-[color:var(--ds-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search id, asset, intent…"
                className="w-full bg-transparent font-mono text-[11px] text-[color:var(--ds-fg)] outline-none placeholder:text-[color:var(--ds-muted)]"
              />
            </div>

            {anyFilter && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>

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
            title="No matching orders."
            body="Nothing matches the current filters. Try widening the time range, clearing your search, or placing a new intent."
            cta={
              <button
                onClick={clearAll}
                className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em]"
              >
                Clear filters
              </button>
            }
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
                    <div className="mt-1 hidden text-[color:var(--ds-muted)] sm:block">{o.wallet}</div>
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
                      <span className="rounded border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-1.5 py-0.5 text-[color:var(--ds-muted)] sm:hidden">
                        {o.wallet}
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
      <NewOrderDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
