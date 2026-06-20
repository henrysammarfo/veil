import { createFileRoute, Link } from "@tanstack/react-router";
import { ArbBanner } from "@/components/dashboard/ArbBanner";
import { NewOrderDialog } from "@/components/dashboard/NewOrderDialog";
import { SviChart } from "@/components/dashboard/SviChart";
import { classifyIntent } from "@/lib/veil/intent";
import { executeOrder } from "@/lib/veil/api";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/modes")({
  head: () => ({ meta: [{ title: "Execution Modes · Veil" }] }),
  component: ModesPage,
});

const MODES = [
  { id: "BULL", title: "Bull", desc: "Stealth TWAP directional execution" },
  { id: "BEAR", title: "Bear", desc: "PLP + covered range vault" },
  { id: "EARN", title: "Earn", desc: "Auto-compound keeper" },
  { id: "PARLAY", title: "Parlay", desc: "Correlated multi-prediction" },
] as const;

function ModesPage() {
  const [intent, setIntent] = useState("");
  const [busy, setBusy] = useState(false);

  const runNoob = async () => {
    const parsed = classifyIntent(intent);
    setBusy(true);
    try {
      const result = await executeOrder({
        direction: parsed.direction,
        asset: parsed.asset,
        sizeUsdc: 500,
        timeHorizonHours: parsed.timeframeDays * 24,
        userConvictionPct: parsed.convictionPct,
        maxSlippageBps: 50,
        mode: "BULL",
        intent,
      });
      toast.success(`Executed ${result.executionId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Execute failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h1 className="font-display text-3xl">Execution modes</h1>
        <p className="mt-2 text-white/60">Four adaptive engines — Bull, Bear, Earn, Parlay.</p>
      </div>

      <ArbBanner />
      <SviChart />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Noob mode</p>
        <textarea
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm"
          rows={3}
          placeholder="What do you think about markets?"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || !intent.trim()}
          onClick={() => void runNoob()}
          className="mt-4 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black disabled:opacity-40"
        >
          {busy ? "Executing…" : "Execute"}
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {MODES.map((m) => (
          <div key={m.id} className="rounded-2xl border border-white/10 p-5">
            <h2 className="font-display text-xl">{m.title}</h2>
            <p className="mt-2 text-sm text-white/60">{m.desc}</p>
            <div className="mt-4">
              <NewOrderDialog defaultMode={m.id} trigger />
            </div>
          </div>
        ))}
      </div>

      <Link to="/dashboard/proofs" className="text-sm text-cyan-400 underline">
        Institution reports →
      </Link>
    </div>
  );
}
