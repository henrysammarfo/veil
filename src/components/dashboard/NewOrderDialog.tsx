import { useEffect, useState } from "react";
import { X, Plus, Sparkles, TrendingUp, TrendingDown, Coins, Layers } from "lucide-react";
import { toast } from "sonner";
import { useVeilData } from "@/lib/dashboard/veilStore";
import type { OrderMode } from "@/lib/dashboard/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { TokenIcon } from "./TokenIcon";

const ASSETS = ["BTC/USDC", "ETH/USDC", "SUI/USDC", "SOL/USDC"] as const;

type DialogProps =
  | { open: boolean; onClose: () => void; defaultMode?: OrderMode; trigger?: never }
  | { defaultMode?: OrderMode; trigger?: boolean; open?: never; onClose?: never };

export function NewOrderDialog(props: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = "open" in props && props.open !== undefined ? props.open : internalOpen;
  const onClose =
    "onClose" in props && props.onClose ? props.onClose : () => setInternalOpen(false);
  const defaultMode = props.defaultMode ?? "BULL";

  const { placeOrder } = useVeilData();
  const { user } = useAuth();
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("BTC/USDC");
  const [mode, setMode] = useState<OrderMode>(defaultMode);
  const [notional, setNotional] = useState(10_000);
  const [days, setDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.address) {
      toast.error("Sign in first");
      return;
    }
    setSubmitting(true);
    const sym = asset.split("/")[0]!;
    const intent = `${mode} ${sym} over ${days}d · $${(notional / 1000).toFixed(0)}k`;
    try {
      const order = await placeOrder({
        asset,
        mode,
        wallet: user.address,
        intent,
        sizeUsdc: notional,
        timeHorizonHours: days * 24,
        direction: mode === "BEAR" ? "SHORT" : "LONG",
      });
      toast.success(`Order ${order.id}`, {
        description: `${order.slices.total} stealth slices · attestation sealed`,
      });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Execute failed");
    } finally {
      setSubmitting(false);
    }
  }

  const dialog = open ? (
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4 pb-24"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-3xl border border-[color:var(--ds-border)] bg-[color:var(--ds-surface)] shadow-2xl ds-glass"
      >
        <header className="flex items-center justify-between border-b border-[color:var(--ds-border)] px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
              New intent
            </div>
            <h2 className="font-display text-xl">Place stealth order</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--ds-border)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-5 px-6 py-5">
          <Field label="Strategy">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  { k: "BULL", label: "Bull", Icon: TrendingUp },
                  { k: "BEAR", label: "Bear", Icon: TrendingDown },
                  { k: "EARN", label: "Earn", Icon: Coins },
                  { k: "PARLAY", label: "Parlay", Icon: Layers },
                ] as const
              ).map(({ k, label, Icon }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMode(k)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs ${
                    mode === k
                      ? "border-[color:var(--ds-accent)] bg-[color:var(--ds-accent)]/10"
                      : "border-[color:var(--ds-border)] bg-[color:var(--ds-pill)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-mono uppercase tracking-[0.1em]">{label}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Market">
            <div className="flex items-center gap-3 rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-2">
              <TokenIcon asset={asset} className="h-6 w-6" />
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value as (typeof ASSETS)[number])}
                className="w-full bg-transparent font-mono text-sm outline-none"
              >
                {ASSETS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </Field>
          <Field label={`Notional · $${notional.toLocaleString()}`}>
            <input
              type="range"
              min={500}
              max={250_000}
              step={500}
              value={notional}
              onChange={(e) => setNotional(Number(e.target.value))}
              className="w-full accent-[color:var(--ds-accent)]"
            />
          </Field>
          <Field label={`Horizon · ${days} day${days === 1 ? "" : "s"}`}>
            <input
              type="range"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-[color:var(--ds-accent)]"
            />
          </Field>
          <p className="text-[12px] text-[color:var(--ds-muted)]">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Live enclave execution — saved to your account on veil-api.
          </p>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[color:var(--ds-border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-4 py-2 font-mono text-[11px] uppercase"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[color:var(--ds-accent)] px-5 py-2 font-mono text-[11px] font-bold uppercase text-[color:var(--ds-accent-fg)] disabled:opacity-60"
          >
            {submitting ? "Sealing…" : "Submit"}
          </button>
        </footer>
      </form>
    </div>
  ) : null;

  if ("trigger" in props && props.trigger) {
    return (
      <>
        <button
          type="button"
          onClick={() => setInternalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ds-accent)] px-4 py-2 font-mono text-[11px] font-bold uppercase"
        >
          <Plus className="h-4 w-4" /> New order
        </button>
        {internalOpen && dialog}
      </>
    );
  }

  return dialog;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
