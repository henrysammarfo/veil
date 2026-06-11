import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Droplets, Archive, ExternalLink } from "lucide-react";
import { DSCard, DSSectionTitle, DSSkeleton } from "@/components/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/liquidity")({
  head: () => ({ meta: [{ title: "Liquidity · Veil" }] }),
  component: LiquidityPage,
});

const ARCHIVE = [
  { date: "2026-06-11", hash: "0x9d4c…77a1", size: "1.4 MB", proofs: 27 },
  { date: "2026-06-10", hash: "0x71f0…b220", size: "1.9 MB", proofs: 31 },
  { date: "2026-06-09", hash: "0x402a…ee18", size: "0.8 MB", proofs: 14 },
  { date: "2026-06-08", hash: "0x18bc…d490", size: "1.1 MB", proofs: 19 },
  { date: "2026-06-07", hash: "0xc041…22f8", size: "0.6 MB", proofs: 9 },
];

const POOLS = [
  { name: "USDC / BTC", depth: "$214k", spread: "6 bps", apr: "12.4%" },
  { name: "USDC / ETH", depth: "$182k", spread: "8 bps", apr: "9.8%" },
  { name: "USDC / SOL", depth: "$96k", spread: "11 bps", apr: "15.1%" },
];

function LiquidityPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Liquidity</h1>
        <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
          The pools the router taps into, and the Walrus archive where every
          daily report is sealed.
        </p>
      </div>

      <DSCard>
        <DSSectionTitle icon={Droplets} title="Routed Pools" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-5">
                  <DSSkeleton className="h-4 w-24" />
                  <DSSkeleton className="mt-3 h-6 w-20" />
                </div>
              ))
            : POOLS.map((p) => (
                <div
                  key={p.name}
                  className="rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-5 transition-colors hover:bg-[color:var(--ds-hover)]"
                >
                  <div className="font-mono text-[13px]">{p.name}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div>
                      <div className="text-[color:var(--ds-muted)]">depth</div>
                      <div className="mt-1">{p.depth}</div>
                    </div>
                    <div>
                      <div className="text-[color:var(--ds-muted)]">spread</div>
                      <div className="mt-1">{p.spread}</div>
                    </div>
                    <div>
                      <div className="text-[color:var(--ds-muted)]">apr</div>
                      <div className="mt-1 text-emerald-400">{p.apr}</div>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </DSCard>

      <DSCard>
        <DSSectionTitle
          icon={Archive}
          title="Walrus Archive"
          action={
            <span className="font-mono text-[10px] text-[color:var(--ds-muted)]">
              walrus.site/veil
            </span>
          }
        />
        {loading ? (
          <div className="mt-6 space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <DSSkeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-[color:var(--ds-border)]">
            {ARCHIVE.map((a) => (
              <li
                key={a.hash}
                className="grid grid-cols-12 items-center gap-3 py-3 font-mono text-[12px]"
              >
                <span className="col-span-3">{a.date}</span>
                <span className="col-span-4 text-[color:var(--ds-muted)]">{a.hash}</span>
                <span className="col-span-2 text-[color:var(--ds-muted)]">{a.size}</span>
                <span className="col-span-2 text-emerald-400">{a.proofs} proofs</span>
                <a
                  href="#"
                  className="col-span-1 flex justify-end text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                  aria-label="Open"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </DSCard>
    </div>
  );
}
