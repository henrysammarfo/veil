import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CircleDot, Copy, Check } from "lucide-react";
import { useState } from "react";
import { DSCard, DSEmpty, DSSectionTitle } from "@/components/DashboardShell";
import { ProofConsole } from "@/components/dashboard/ProofConsole";
import { copyToClipboard, useMockData } from "@/lib/dashboard/mockStore";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/orders/$orderId")({
  head: ({ params }) => ({ meta: [{ title: `Order ${params.orderId} · Veil` }] }),
  component: OrderDetailPage,
  errorComponent: ({ error, reset }) => (
    <div className="space-y-3 p-6 text-sm">
      <h2 className="font-display text-xl">Couldn't load this order</h2>
      <p className="text-[color:var(--ds-muted)]">{error.message}</p>
      <button onClick={reset} className="rounded-full border border-[color:var(--ds-border)] px-4 py-1.5 font-mono text-[11px] uppercase">retry</button>
    </div>
  ),
  notFoundComponent: () => (
    <DSEmpty icon={Activity} title="Order not found." body="It may have settled and been archived to Walrus." />
  ),
});

function OrderDetailPage() {
  const { orderId } = useParams({ from: "/_authenticated/dashboard/orders/$orderId" });
  const { orders } = useMockData();
  const order = orders.find((o) => o.id === orderId);
  const [copied, setCopied] = useState(false);

  if (!order) {
    return (
      <DSEmpty
        icon={Activity}
        title="Order not found"
        body={`No order with id ${orderId} in the current mock dataset.`}
        cta={
          <Link
            to="/dashboard/orders"
            className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em]"
          >
            Back to Orders
          </Link>
        }
      />
    );
  }

  async function copyId() {
    if (await copyToClipboard(order!.id)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/orders"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
      >
        <ArrowLeft className="h-3 w-3" /> All orders
      </Link>

      <DSCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[color:var(--ds-muted)]">
              <span>{order.id}</span>
              <button onClick={copyId} className="hover:text-[color:var(--ds-fg)]">
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
              <span>· {order.asset}</span>
            </div>
            <h1 className="mt-3 font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight">
              {order.intent}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em]">
              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                <CircleDot className={`mr-1 inline h-2.5 w-2.5 ${order.state === "EXECUTING" ? "animate-pulse" : ""}`} />
                {order.state}
              </span>
              <span className="rounded border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-2 py-0.5">{order.mode}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">Realized</div>
            <div className="mt-1 font-display text-3xl text-emerald-400">{order.pnl}</div>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-[color:var(--ds-muted)]">
            <span>Slice progress</span>
            <span>{order.slices.filled} / {order.slices.total} · {order.progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--ds-pill)]">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500" style={{ width: `${order.progress}%` }} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { l: "Mode", v: order.mode },
            { l: "Created", v: new Date(order.createdAt).toLocaleString() },
            { l: "Asset", v: order.asset },
          ].map((x) => (
            <div key={x.l} className="rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">{x.l}</div>
              <div className="mt-1 text-sm">{x.v}</div>
            </div>
          ))}
        </div>
      </DSCard>

      <DSCard>
        <DSSectionTitle title="Proofs for this order" />
        <div className="mt-5">
          <ProofConsole max={50} />
        </div>
      </DSCard>
    </div>
  );
}
