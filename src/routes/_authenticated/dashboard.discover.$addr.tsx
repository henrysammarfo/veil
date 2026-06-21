import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, ArrowLeft, Copy, Check } from "lucide-react";
import { DSCard, DSEmpty, DSSkeleton } from "@/components/DashboardShell";
import { copyToClipboard } from "@/lib/dashboard/clipboard";
import { fetchTraderProfile } from "@/lib/veil/api";
import { pnlColorClass, pnlLabel, pnlSubLabel } from "@/lib/dashboard/pnl";
import type { Order } from "@/lib/dashboard/types";

export const Route = createFileRoute("/_authenticated/dashboard/discover/$addr")({
  head: ({ params }) => ({ meta: [{ title: `Trader ${params.addr.slice(0, 8)}… · Veil` }] }),
  component: TraderProfilePage,
});

function TraderProfilePage() {
  const { addr } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchTraderProfile>> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchTraderProfile(addr)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addr]);

  async function copyAddr() {
    if (await copyToClipboard(addr)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <DSSkeleton className="h-8 w-48" />
        <DSCard>
          <DSSkeleton className="h-24 w-full" />
        </DSCard>
      </div>
    );
  }

  if (!profile) {
    return (
      <DSEmpty
        icon={Compass}
        title="Profile not available"
        body="This trader hid their Discover profile or has no public history yet."
        cta={
          <Link
            to="/dashboard/discover"
            className="rounded-full border border-[color:var(--ds-border)] px-4 py-2 font-mono text-[11px] uppercase"
          >
            Back to Discover
          </Link>
        }
      />
    );
  }

  const orders = (profile.orders ?? []) as Order[];

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/discover"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
      >
        <ArrowLeft className="h-3 w-3" /> Discover
      </Link>

      <DSCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
              Leader profile
            </div>
            <button
              type="button"
              onClick={() => void copyAddr()}
              className="mt-2 inline-flex items-center gap-2 font-mono text-lg hover:text-[color:var(--ds-accent)]"
            >
              {profile.shortAddr}
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center font-mono text-[11px]">
            <div>
              <div className="font-display text-2xl">{profile.winrate}%</div>
              <div className="text-[color:var(--ds-muted)]">win rate</div>
            </div>
            <div>
              <div className="font-display text-2xl text-emerald-400">{profile.pnl}</div>
              <div className="text-[color:var(--ds-muted)]">dUSDC PnL</div>
            </div>
            <div>
              <div className="font-display text-2xl">{profile.closed}</div>
              <div className="text-[color:var(--ds-muted)]">settled</div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-[12px] text-[color:var(--ds-muted)]">
          Volume {profile.vol}. Copy this address into a new order intent to shadow their routing
          style.
        </p>
      </DSCard>

      <DSCard>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
          Trade history
        </h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--ds-muted)]">No orders to show.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--ds-border)]">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  to="/dashboard/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-[color:var(--ds-hover)]"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] text-[color:var(--ds-muted)]">
                      {o.mode} · {o.state}
                    </div>
                    <p className="truncate text-sm">{o.intent}</p>
                  </div>
                  <div className={`text-right font-mono text-[12px] ${pnlColorClass(o)}`}>
                    {pnlLabel(o)}
                    <div className="text-[10px] text-[color:var(--ds-muted)]">{pnlSubLabel(o)}</div>
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
