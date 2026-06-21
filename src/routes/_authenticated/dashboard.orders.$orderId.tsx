import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CircleDot, Copy, Check, FileJson, ExternalLink, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { DSCard, DSEmpty, DSSectionTitle } from "@/components/DashboardShell";
import { ProofConsole } from "@/components/dashboard/ProofConsole";
import { copyToClipboard } from "@/lib/dashboard/clipboard";
import { useVeilData } from "@/lib/dashboard/veilStore";
import { useAuth } from "@/lib/auth/AuthProvider";
import { fetchOrderDetail } from "@/lib/veil/api";
import type { Order } from "@/lib/dashboard/types";
import { pnlColorClass, pnlSubLabel } from "@/lib/dashboard/pnl";

export const Route = createFileRoute("/_authenticated/dashboard/orders/$orderId")({
  head: ({ params }) => ({ meta: [{ title: `Order ${params.orderId} · Veil` }] }),
  component: OrderDetailPage,
  notFoundComponent: () => (
    <DSEmpty
      icon={Activity}
      title="Order not found."
      body="It may have settled and been archived to Walrus."
      className="pb-24 md:pb-12"
    />
  ),
});

function OrderDetailPage() {
  const { orderId } = useParams({ from: "/_authenticated/dashboard/orders/$orderId" });
  const { user } = useAuth();
  const { getOrder } = useVeilData();
  const cached = getOrder(orderId);
  const [order, setOrder] = useState<Order | null>(cached ?? null);
  const [execution, setExecution] = useState<Record<string, unknown> | null>(
    cached?.payload ?? null,
  );
  const [copied, setCopied] = useState<string | null>(null);

  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (!user?.address) return;
    setLoading(true);
    void fetchOrderDetail(user.address, orderId).then((row) => {
      if (row) {
        setOrder(row.order);
        setExecution(row.execution);
      }
      setLoading(false);
    });
  }, [user?.address, orderId]);

  if (loading && !order) {
    return (
      <div className="space-y-6 pb-8">
        <DSCard>
          <div className="h-8 w-48 animate-pulse rounded bg-[color:var(--ds-skeleton)]" />
          <div className="mt-4 h-12 w-full animate-pulse rounded bg-[color:var(--ds-skeleton)]" />
        </DSCard>
      </div>
    );
  }

  if (!order) {
    return (
      <DSEmpty
        icon={Activity}
        title="Order not found"
        body={`No order with id ${orderId}. Place a new intent from the dashboard.`}
        className="pb-24 md:pb-12"
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

  async function copy(text: string, key: string) {
    if (await copyToClipboard(text)) {
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    }
  }

  const payload = execution ?? order.payload ?? {};

  return (
    <div className="space-y-6 pb-8">
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
              <span className="truncate">{order.id}</span>
              <button
                onClick={() => copy(order.id, "id")}
                className="hover:text-[color:var(--ds-fg)]"
              >
                {copied === "id" ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
              <span>· {order.asset}</span>
            </div>
            <h1 className="mt-3 font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight">
              {order.intent}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em]">
              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                <CircleDot
                  className={`mr-1 inline h-2.5 w-2.5 ${order.state === "EXECUTING" ? "animate-pulse" : ""}`}
                />
                {order.state}
              </span>
              <span className="rounded border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-2 py-0.5">
                {order.mode}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
              {order.realizedPnlUsd != null ? "Settled PnL" : "Unsettled estimate"}
            </div>
            <div className={`mt-1 font-display text-3xl ${pnlColorClass(order)}`}>{order.pnl}</div>
            <div className="font-mono text-[10px] text-[color:var(--ds-muted)]">{pnlSubLabel(order)}</div>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-[color:var(--ds-muted)]">
            <span>Slice progress</span>
            <span>
              {order.slices.filled} / {order.slices.total} · {order.progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--ds-pill)]">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
              style={{ width: `${order.progress}%` }}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Mode", v: order.mode },
            { l: "Notional", v: order.sizeUsdc ? `${order.sizeUsdc.toLocaleString()} dUSDC` : "n/a" },
            { l: "Wallet", v: order.wallet.slice(0, 10) + "…" },
            { l: "Created", v: new Date(order.createdAt).toLocaleString() },
          ].map((x) => (
            <div
              key={x.l}
              className="rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-4"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                {x.l}
              </div>
              <div className="mt-1 break-all text-sm">{x.v}</div>
            </div>
          ))}
        </div>

        {order.reportUrl && (
          <a
            href={order.reportUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-amber-400 hover:underline"
          >
            Walrus report <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </DSCard>

      <DSCard>
        <DSSectionTitle
          icon={FileJson}
          title="Execution payload"
          action={
            <button
              onClick={() => copy(JSON.stringify(payload, null, 2), "json")}
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
            >
              {copied === "json" ? "Copied" : "Copy JSON"}
            </button>
          }
        />
        <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-[color:var(--ds-border)] bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-emerald-100/90">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </DSCard>

      <DSCard>
        <DSSectionTitle title={`Proofs · ${orderId}`} />
        <div className="mt-5">
          <ProofConsole max={50} orderId={orderId} />
        </div>
      </DSCard>
    </div>
  );
}
