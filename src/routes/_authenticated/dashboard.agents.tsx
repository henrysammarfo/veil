import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bot, Plus, CircleDot } from "lucide-react";
import { DSCard, DSEmpty, DSSectionTitle } from "@/components/DashboardShell";
import { ArbBanner } from "@/components/dashboard/ArbBanner";
import { NewOrderDialog } from "@/components/dashboard/NewOrderDialog";
import { SviChart } from "@/components/dashboard/SviChart";
import { useVeilData } from "@/lib/dashboard/veilStore";
import { pnlColorClass, pnlLabel, pnlSubLabel } from "@/lib/dashboard/pnl";
import type { Order, OrderMode } from "@/lib/dashboard/types";

export const Route = createFileRoute("/_authenticated/dashboard/agents")({
  head: () => ({ meta: [{ title: "Engines · Veil" }] }),
  component: EnginesPage,
});

const MODE_LABEL: Record<OrderMode, string> = {
  BULL: "veil-bull",
  BEAR: "veil-bear",
  EARN: "veil-earn",
  PARLAY: "veil-parlay",
};

function EnginesPage() {
  const { orders } = useVeilData();
  const [open, setOpen] = useState(false);

  const byMode = useMemo(() => {
    const map = new Map<OrderMode, Order>();
    for (const o of orders) {
      if (!map.has(o.mode)) map.set(o.mode, o);
    }
    return map;
  }, [orders]);

  const cards = (["BULL", "BEAR", "EARN", "PARLAY"] as OrderMode[]).map((mode) => {
    const o = byMode.get(mode);
    return { mode, order: o, name: MODE_LABEL[mode] };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Engines</h1>
          <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
            Your live stealth engines from real orders. Each run is attested inside Nautilus TEE;
            PCR0 is verifiable on Sui.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--ds-accent)] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[color:var(--ds-accent-fg)] transition-opacity hover:opacity-90 sm:px-5 sm:py-2.5"
        >
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      <ArbBanner />
      <SviChart />

      {orders.length === 0 ? (
        <DSEmpty
          icon={Bot}
          title="No engines running yet."
          body="Place your first stealth order. Each mode shows up here with live slice progress."
          cta={
            <button
              onClick={() => setOpen(true)}
              className="rounded-full bg-[color:var(--ds-accent)] px-4 py-2 font-mono text-[11px] font-bold uppercase text-[color:var(--ds-accent-fg)]"
            >
              New order
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map(({ mode, order, name }) =>
            order ? (
              <Link key={mode} to="/dashboard/orders/$orderId" params={{ orderId: order.id }}>
                <DSCard className="block transition-colors hover:bg-[color:var(--ds-hover)]">
                  <DSSectionTitle
                    icon={Bot}
                    title={name}
                    action={
                      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
                        <CircleDot
                          className={`h-3 w-3 ${
                            order.state === "EXECUTING"
                              ? "animate-pulse text-emerald-400"
                              : order.state === "PENDING"
                                ? "text-[color:var(--ds-muted)]"
                                : "text-amber-400"
                          }`}
                        />
                        {order.state}
                      </span>
                    }
                  />
                  <p className="mt-4 line-clamp-2 text-sm text-[color:var(--ds-fg)]">{order.intent}</p>
                  <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-[color:var(--ds-muted)]">
                    <span>{mode}</span>
                    <span>
                      {order.slices.filled} / {order.slices.total} slices
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[color:var(--ds-pill)]">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                  <div className={`mt-3 font-mono text-[11px] ${pnlColorClass(order)}`}>
                    {pnlLabel(order)}
                    <span className="ml-2 text-[color:var(--ds-muted)]">{pnlSubLabel(order)}</span>
                  </div>
                </DSCard>
              </Link>
            ) : (
              <DSCard key={mode} className="opacity-60">
                <DSSectionTitle icon={Bot} title={name} />
                <p className="mt-4 text-sm text-[color:var(--ds-muted)]">No {mode} orders yet.</p>
              </DSCard>
            ),
          )}
        </div>
      )}

      <NewOrderDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
