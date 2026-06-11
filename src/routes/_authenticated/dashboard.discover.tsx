import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, TrendingUp, Copy } from "lucide-react";
import { DSCard, DSSectionTitle, DSSkeleton, DSEmpty } from "@/components/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/discover")({
  head: () => ({ meta: [{ title: "Discover · Veil" }] }),
  component: DiscoverPage,
});

const LEADERS = [
  { addr: "0x6daf…af57", closed: 7, winrate: 71, pnl: "+5.67", vol: "$1.1k" },
  { addr: "0x419c…4e9f", closed: 12, winrate: 67, pnl: "+37.27", vol: "$325" },
  { addr: "0x464f…92ad", closed: 9, winrate: 63, pnl: "+12.04", vol: "$135" },
  { addr: "0xb12e…77a1", closed: 22, winrate: 58, pnl: "+44.12", vol: "$890" },
  { addr: "0xae09…331c", closed: 5, winrate: 80, pnl: "+9.81", vol: "$420" },
  { addr: "0x771a…f203", closed: 18, winrate: 55, pnl: "+27.40", vol: "$612" },
];

function avatar(addr: string) {
  let h = 0;
  for (let i = 0; i < addr.length; i++) h = (h * 31 + addr.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 60) % 360} 70% 35%))`;
}

function DiscoverPage() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"1H" | "6H" | "24H">("6H");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Discover</h1>
        <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
          Browse top leaders the enclave is shadowing right now. Copy any
          address into a stealth-order intent and Veil will route the slices
          privately.
        </p>
      </div>

      <DSCard>
        <DSSectionTitle
          icon={Compass}
          title="Top Leaders · Win Rate"
          action={
            <div className="flex items-center gap-1 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-1 font-mono text-[10px] uppercase tracking-[0.15em]">
              {(["1H", "6H", "24H"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    range === r
                      ? "bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)]"
                      : "text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          }
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-5">
                  <DSSkeleton className="h-3 w-16" />
                  <DSSkeleton className="h-5 w-32" />
                  <DSSkeleton className="h-3 w-24" />
                  <DSSkeleton className="h-6 w-20" />
                </div>
              ))
            : LEADERS.map((l) => (
                <div
                  key={l.addr}
                  className="group rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-5 transition-colors hover:bg-[color:var(--ds-hover)]"
                >
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                    <span>{l.closed} closed</span>
                    <button
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Copy address"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-lg"
                      style={{ background: avatar(l.addr) }}
                    />
                    <div className="font-mono text-[13px]">{l.addr}</div>
                    <span className="ml-auto rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
                      {l.winrate}%
                    </span>
                  </div>
                  <div className="mt-4 border-t border-[color:var(--ds-border)] pt-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                      P&L Generated
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="font-display text-2xl text-emerald-400">
                        {l.pnl} <span className="text-base text-[color:var(--ds-muted)]">aUSD</span>
                      </span>
                      <span className="font-mono text-[11px] text-[color:var(--ds-muted)]">
                        vol {l.vol}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </DSCard>
    </div>
  );
}
