import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, Copy, Check } from "lucide-react";
import { DSCard, DSSectionTitle, DSSkeleton } from "@/components/DashboardShell";
import { copyToClipboard } from "@/lib/dashboard/clipboard";
import { fetchLeaders } from "@/lib/veil/api";

export const Route = createFileRoute("/_authenticated/dashboard/discover/")({
  head: () => ({ meta: [{ title: "Discover · Veil" }] }),
  component: DiscoverPage,
});

type Leader = {
  addr: string;
  shortAddr: string;
  closed: number;
  winrate: number;
  pnl: string;
  vol: string;
};

function avatar(addr: string) {
  let h = 0;
  for (let i = 0; i < addr.length; i++) h = (h * 31 + addr.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 60) % 360} 70% 35%))`;
}

function DiscoverPage() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"1H" | "6H" | "24H">("24H");
  const [copied, setCopied] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchLeaders(range)
      .then((rows) => {
        if (!cancelled) setLeaders(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  async function handleCopy(e: React.MouseEvent, addr: string) {
    e.preventDefault();
    e.stopPropagation();
    if (await copyToClipboard(addr)) {
      setCopied(addr);
      setTimeout(() => setCopied((c) => (c === addr ? null : c)), 1200);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Discover</h1>
        <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
          Top leaders by settled win rate. Tap a card for trade history. Copy any address into a
          stealth order intent to shadow their style privately.
        </p>
      </div>

      <DSCard>
        <DSSectionTitle
          icon={Compass}
          title="Leaderboard · win rate"
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
                <div
                  key={i}
                  className="space-y-3 rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-5"
                >
                  <DSSkeleton className="h-3 w-16" />
                  <DSSkeleton className="h-5 w-32" />
                  <DSSkeleton className="h-3 w-24" />
                  <DSSkeleton className="h-6 w-20" />
                </div>
              ))
            : leaders.length === 0
              ? (
                <p className="col-span-full py-8 text-center text-sm text-[color:var(--ds-muted)]">
                  No settled leaders in this window yet. Execute and settle a stealth order to
                  appear here.
                </p>
              )
              : leaders.map((l, rank) => (
                <Link
                  key={l.addr}
                  to="/dashboard/discover/$addr"
                  params={{ addr: l.addr }}
                  className="group block rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-5 transition-colors hover:bg-[color:var(--ds-hover)]"
                >
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                    <span className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full border border-[color:var(--ds-border)] text-[11px] text-[color:var(--ds-fg)]">
                        {rank + 1}
                      </span>
                      {l.closed} closed
                    </span>
                    <button
                      type="button"
                      onClick={(e) => void handleCopy(e, l.addr)}
                      className="opacity-60 transition-opacity hover:opacity-100"
                      aria-label="Copy address"
                    >
                      {copied === l.addr ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg" style={{ background: avatar(l.addr) }} />
                    <div className="font-mono text-[13px]">{l.shortAddr}</div>
                    <span className="ml-auto rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
                      {l.winrate}% win
                    </span>
                  </div>
                  <div className="mt-4 border-t border-[color:var(--ds-border)] pt-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                      PnL generated
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="font-display text-2xl text-emerald-400">
                        {l.pnl}{" "}
                        <span className="text-base text-[color:var(--ds-muted)]">dUSDC</span>
                      </span>
                      <span className="font-mono text-[11px] text-[color:var(--ds-muted)]">
                        vol {l.vol}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </DSCard>
    </div>
  );
}
