import { createFileRoute, Link } from "@tanstack/react-router";
import { ArbBanner } from "@/components/dashboard/ArbBanner";
import { NewOrderDialog } from "@/components/dashboard/NewOrderDialog";
import { SviChart } from "@/components/dashboard/SviChart";
import { parseIntent, formatParsedIntent, parsedHorizonHours, type ParsedIntent } from "@/lib/veil/intent";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useVeilData } from "@/lib/dashboard/veilStore";
import { useEffect, useState } from "react";
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
  const { user } = useAuth();
  const { placeOrder } = useVeilData();
  const [intent, setIntent] = useState("");
  const [parsed, setParsed] = useState<ParsedIntent | null>(null);
  const [parsing, setParsing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const trimmed = intent.trim();
    if (!trimmed) {
      setParsed(null);
      return;
    }
    setParsing(true);
    const t = setTimeout(() => {
      void parseIntent(trimmed).then((p) => {
        setParsed(p);
        setParsing(false);
      });
    }, 450);
    return () => clearTimeout(t);
  }, [intent]);

  const runNoob = async () => {
    if (!user?.address) {
      toast.error("Sign in first");
      return;
    }
    const p = await parseIntent(intent);
    setBusy(true);
    try {
      const order = await placeOrder({
        asset: `${p.asset}/USDC`,
        mode: p.mode,
        wallet: user.address,
        intent,
        sizeUsdc: 25,
        timeHorizonHours: parsedHorizonHours(p),
        direction: p.mode === "BEAR" ? "SHORT" : p.direction,
        userConvictionPct: p.convictionPct,
      });
      toast.success(`Order ${order.id}`, {
        description: formatParsedIntent(p),
      });
      setIntent("");
      setParsed(null);
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
        <p className="mt-2 text-[color:var(--ds-muted)]">
          Four adaptive engines: Bull, Bear, Earn, Parlay. LLM parses your intent in the enclave.
        </p>
      </div>

      <ArbBanner />
      <SviChart />

      <section className="rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
          Plain English intent
        </p>
        <textarea
          className="mt-4 w-full rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-surface)] p-4 text-sm outline-none focus:ring-1 focus:ring-[color:var(--ds-accent)]"
          rows={3}
          placeholder="I think Bitcoin rips this week, go long"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
        {parsed && (
          <p className="mt-2 font-mono text-[11px] text-emerald-400">
            {parsing ? "Parsing…" : `→ ${formatParsedIntent(parsed)}`}
          </p>
        )}
        <button
          type="button"
          disabled={busy || !intent.trim()}
          onClick={() => void runNoob()}
          className="mt-4 rounded-full bg-[color:var(--ds-accent)] px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--ds-accent-fg)] disabled:opacity-40"
        >
          {busy ? "Executing…" : "Submit intent"}
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {MODES.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-5 text-[color:var(--ds-fg)]"
          >
            <h2 className="font-display text-xl text-[color:var(--ds-fg)]">{m.title}</h2>
            <p className="mt-2 text-sm text-[color:var(--ds-muted)]">{m.desc}</p>
            <div className="mt-4 [&_button]:text-[color:var(--ds-accent-fg)]">
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
