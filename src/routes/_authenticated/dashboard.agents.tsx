import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Plus, CircleDot } from "lucide-react";
import { DSCard, DSSectionTitle, DSSkeleton, DSEmpty } from "@/components/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/agents")({
  head: () => ({ meta: [{ title: "Agents · Veil" }] }),
  component: AgentsPage,
});

const AGENTS = [
  { name: "veil-bull", state: "EXECUTING", intent: "BTC up · 7d · $50k", k: 11, filled: 7, mode: "BULL" },
  { name: "veil-bear", state: "SETTLED", intent: "ETH range-sell · 14d", k: 9, filled: 9, mode: "BEAR" },
  { name: "veil-earn", state: "ACCRUING", intent: "PLP auto-compound · USDC", k: 0, filled: 0, mode: "EARN" },
  { name: "veil-router", state: "IDLE", intent: "—", k: 0, filled: 0, mode: "UTIL" },
];

function AgentsPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Agents</h1>
          <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
            Stealth-order engines running inside Nautilus TEE enclaves. Each
            agent is attested — its PCR0 hash is verifiable on Sui.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ds-accent)] px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[color:var(--ds-accent-fg)] transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" /> New Stealth Order
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <DSCard key={i}>
                <DSSkeleton className="h-4 w-32" />
                <DSSkeleton className="mt-3 h-3 w-48" />
                <DSSkeleton className="mt-6 h-2 w-full" />
              </DSCard>
            ))
          : AGENTS.map((a) => (
              <DSCard key={a.name}>
                <DSSectionTitle
                  icon={Bot}
                  title={a.name}
                  action={
                    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
                      <CircleDot
                        className={`h-3 w-3 ${
                          a.state === "EXECUTING"
                            ? "animate-pulse text-emerald-400"
                            : a.state === "IDLE"
                            ? "text-[color:var(--ds-muted)]"
                            : "text-amber-400"
                        }`}
                      />
                      {a.state}
                    </span>
                  }
                />
                <p className="mt-4 text-sm text-[color:var(--ds-fg)]">{a.intent}</p>
                <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-[color:var(--ds-muted)]">
                  <span>{a.mode}</span>
                  <span>
                    {a.filled} / {a.k} slices
                  </span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[color:var(--ds-pill)]">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                    style={{ width: `${a.k ? (a.filled / a.k) * 100 : 0}%` }}
                  />
                </div>
              </DSCard>
            ))}
      </div>
    </div>
  );
}
