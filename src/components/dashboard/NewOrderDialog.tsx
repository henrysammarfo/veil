import { useEffect, useState } from "react";
import { X, Plus, Sparkles, TrendingUp, TrendingDown, Coins } from "lucide-react";
import { useMockData, type OrderMode } from "@/lib/dashboard/mockStore";

const ASSETS = ["BTC/USDC", "ETH/USDC", "SUI/USDC", "SOL/USDC"] as const;

export function NewOrderDialog({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const { addOrder, wallets } = useMockData();
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("BTC/USDC");
  const [mode, setMode] = useState<OrderMode>("BULL");
  const [notional, setNotional] = useState(10_000);
  const [days, setDays] = useState(7);
  const [wallet, setWallet] = useState(wallets[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    addOrder({
      asset, mode, wallet,
      intent: `${mode === "BULL" ? "Accumulate" : mode === "BEAR" ? "Range-sell" : "Auto-compound"} ${asset.split("/")[0]} over ${days} days · $${(notional / 1000).toFixed(0)}k`,
      slices: Math.max(3, Math.min(24, Math.round(days * 1.5))),
    });
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 400);
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[color:var(--ds-border)] bg-[color:var(--ds-surface)] text-[color:var(--ds-fg)] shadow-2xl ds-glass"
      >
        <header className="flex items-center justify-between border-b border-[color:var(--ds-border)] px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">New intent</div>
            <h2 className="font-display text-xl">Place stealth order</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--ds-border)] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-5 px-6 py-5">
          <Field label="Strategy">
            <div className="grid grid-cols-3 gap-2">
              {([
                { k: "BULL", label: "Accumulate", Icon: TrendingUp },
                { k: "BEAR", label: "Distribute", Icon: TrendingDown },
                { k: "EARN", label: "Earn yield", Icon: Coins },
              ] as const).map(({ k, label, Icon }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMode(k)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs transition-colors ${
                    mode === k
                      ? "border-[color:var(--ds-accent)] bg-[color:var(--ds-accent)]/10 text-[color:var(--ds-fg)]"
                      : "border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-mono uppercase tracking-[0.1em]">{label}</span>
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Market">
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value as (typeof ASSETS)[number])}
                className="w-full rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-2.5 font-mono text-sm outline-none"
              >
                {ASSETS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>

            <Field label="Origin wallet">
              <select
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-2.5 font-mono text-sm outline-none"
              >
                {wallets.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
          </div>

          <Field label={`Notional · $${notional.toLocaleString()}`}>
            <input
              type="range"
              min={1000}
              max={250_000}
              step={1000}
              value={notional}
              onChange={(e) => setNotional(Number(e.target.value))}
              className="w-full accent-[color:var(--ds-accent)]"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-[color:var(--ds-muted)]">
              <span>$1k</span><span>$250k</span>
            </div>
          </Field>

          <Field label={`Horizon · ${days} day${days === 1 ? "" : "s"}`}>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-[color:var(--ds-accent)]"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-[color:var(--ds-muted)]">
              <span>1d</span><span>30d</span>
            </div>
          </Field>

          <div className="rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-3 text-[12px] text-[color:var(--ds-muted)]">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[color:var(--ds-fg)]">
              <Sparkles className="h-3 w-3" /> Preview
            </span>
            <p className="mt-1">
              The enclave will split this into ~{Math.max(3, Math.min(24, Math.round(days * 1.5)))} stealth slices and prove every fill on-chain. You stay in control — cancel any time.
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-[color:var(--ds-border)] px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ds-accent)] px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[color:var(--ds-accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" /> {submitting ? "Sealing…" : "Sign & submit"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">{label}</span>
      {children}
    </label>
  );
}
