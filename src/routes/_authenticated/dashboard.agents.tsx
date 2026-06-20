import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Plus, CircleDot, ShieldCheck, Cpu } from "lucide-react";
import { DSCard, DSSectionTitle } from "@/components/DashboardShell";
import { ArbBanner } from "@/components/dashboard/ArbBanner";
import { NewOrderDialog } from "@/components/dashboard/NewOrderDialog";
import { SviChart } from "@/components/dashboard/SviChart";
import { useVeilData } from "@/lib/dashboard/veilStore";
import { useCockpitMode } from "@/lib/dashboard/ModeProvider";

export const Route = createFileRoute("/_authenticated/dashboard/agents")({
  head: () => ({ meta: [{ title: "Engines · Veil" }] }),
  component: EnginesPage,
});

const ENGINES = [
  {
    name: "veil-bull",
    state: "EXECUTING",
    intent: "Accumulate BTC over 7d · $50k",
    k: 11,
    filled: 7,
    mode: "BULL",
    pcr0: "0x8c2fa91d…102",
    desc: "Drips buys into the order book when depth is thick and the spread is tight.",
  },
  {
    name: "veil-bear",
    state: "SETTLED",
    intent: "Distribute ETH over 14d · $20k",
    k: 9,
    filled: 9,
    mode: "BEAR",
    pcr0: "0x55b10fa2…091",
    desc: "Range-sells with a stealth ladder, never showing the full clip.",
  },
  {
    name: "veil-earn",
    state: "ACCRUING",
    intent: "Auto-compound USDC vault",
    k: 30,
    filled: 18,
    mode: "EARN",
    pcr0: "0x9d4c77a1…22f8",
    desc: "Routes idle balance into the best risk-adjusted yield.",
  },
  {
    name: "veil-router",
    state: "IDLE",
    intent: "—",
    k: 0,
    filled: 0,
    mode: "UTIL",
    pcr0: "0x71a044ce…110",
    desc: "The smart-order-router every other engine calls into for fills.",
  },
];

function EnginesPage() {
  const { placeOrder } = useVeilData();
  const { isPro } = useCockpitMode();
  const [open, setOpen] = useState(false);
  void placeOrder;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Engines</h1>
          <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
            Stealth-order engines running inside Nautilus TEE enclaves. Each engine is attested —
            its PCR0 hash is verifiable on Sui.
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

      <div className="grid gap-4 md:grid-cols-2">
        {ENGINES.map((a) => (
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
            <p className="mt-2 text-[12px] text-[color:var(--ds-muted)]">{a.desc}</p>

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

            {isPro && (
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[color:var(--ds-border)] pt-4 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-[color:var(--ds-muted)]">
                  <Cpu className="h-3 w-3" /> Enclave
                </div>
                <div className="truncate">{a.name}-v1.3</div>
                <div className="flex items-center gap-2 text-[color:var(--ds-muted)]">
                  <ShieldCheck className="h-3 w-3" /> PCR0
                </div>
                <div className="truncate">{a.pcr0}</div>
              </div>
            )}
          </DSCard>
        ))}
      </div>

      <NewOrderDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
