import { useEffect, useState } from "react";
import { X, Plus, Sparkles, TrendingUp, TrendingDown, Coins, Layers, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useVeilData } from "@/lib/dashboard/veilStore";
import type { OrderMode } from "@/lib/dashboard/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  parseIntent,
  formatParsedIntent,
  formatHorizon,
  parsedHorizonHours,
  type ParsedIntent,
} from "@/lib/veil/intent";
import { LIVE_MARKETS } from "@/lib/dashboard/markets";
import { TokenIcon } from "./TokenIcon";

const INTENT_EXAMPLES = [
  "15m BTC long — quick scalp to the upside",
  "Earn yield on my idle USDC",
  "Bear hedge: BTC might drop over the next 4 hours",
  "I think Bitcoin rips in 2 days, go long",
];

type HorizonUnit = "minutes" | "hours" | "days";

type DialogProps =
  | { open: boolean; onClose: () => void; defaultMode?: OrderMode; trigger?: never }
  | { defaultMode?: OrderMode; trigger?: boolean; open?: never; onClose?: never };

function applyParsed(p: ParsedIntent) {
  return {
    mode: p.mode,
    horizonUnit: p.timeframeUnit as HorizonUnit,
    horizonValue: p.timeframeValue,
    asset: (LIVE_MARKETS.find((a) => a.startsWith(`${p.asset}/`)) ?? LIVE_MARKETS[0]!) as
      (typeof LIVE_MARKETS)[number],
  };
}

export function NewOrderDialog(props: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = "open" in props && props.open !== undefined ? props.open : internalOpen;
  const onClose =
    "onClose" in props && props.onClose ? props.onClose : () => setInternalOpen(false);
  const defaultMode = props.defaultMode ?? "BULL";

  const { placeOrder } = useVeilData();
  const { user } = useAuth();
  const [intentText, setIntentText] = useState("");
  const [asset, setAsset] = useState<(typeof LIVE_MARKETS)[number]>("BTC/USDC");
  const [parlayLegs, setParlayLegs] = useState<string[]>(["BTC/USDC"]);
  const [mode, setMode] = useState<OrderMode>(defaultMode);
  const [notional, setNotional] = useState(25);
  const [horizonValue, setHorizonValue] = useState(1);
  const [horizonUnit, setHorizonUnit] = useState<HorizonUnit>("hours");
  const [submitting, setSubmitting] = useState(false);
  /** When false, strategy / market / horizon follow the LLM and submit is allowed. */
  const [allowManualEdit, setAllowManualEdit] = useState(false);
  const [parsed, setParsed] = useState<ParsedIntent | null>(null);
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode, open]);

  useEffect(() => {
    if (!open) {
      setIntentText("");
      setAllowManualEdit(false);
      setNotional(25);
      setHorizonValue(1);
      setHorizonUnit("hours");
      setParlayLegs(["BTC/USDC"]);
      setParsed(null);
    }
  }, [open]);

  useEffect(() => {
    const trimmed = intentText.trim();
    if (!trimmed) {
      setParsed(null);
      setParsing(false);
      return;
    }
    setAllowManualEdit(false);
    setParsing(true);
    const t = setTimeout(() => {
      void parseIntent(trimmed).then((p) => {
        setParsed(p);
        setParsing(false);
      });
    }, 450);
    return () => clearTimeout(t);
  }, [intentText]);

  useEffect(() => {
    if (!parsed || allowManualEdit) return;
    const next = applyParsed(parsed);
    setMode(next.mode);
    setHorizonUnit(next.horizonUnit);
    setHorizonValue(next.horizonValue);
    setAsset(next.asset);
  }, [parsed, allowManualEdit]);

  function horizonLabel(): string {
    return formatHorizon({ timeframeValue: horizonValue, timeframeUnit: horizonUnit });
  }

  const configLocked = !!parsed && !allowManualEdit;
  const canSubmit =
    !!intentText.trim() && !!parsed && !parsing && !allowManualEdit && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.address) {
      toast.error("Sign in first");
      return;
    }
    const intent = intentText.trim();
    if (!intent) {
      toast.error("Describe your intent in plain English");
      return;
    }
    if (!parsed) {
      toast.error("Wait for your intent to be parsed");
      return;
    }
    if (allowManualEdit) {
      toast.error("Reset to intent settings before submitting");
      return;
    }
    if (mode === "PARLAY" && parlayLegs.length < 2) {
      toast.error("Parlay needs at least two markets. Add another leg below.");
      return;
    }

    setSubmitting(true);
    toast.info("Sealing order in the enclave — can take up to 3 minutes. Keep this tab open.", {
      duration: 8000,
    });

    const fresh = await parseIntent(intent);
    const direction =
      fresh.mode === "BEAR" ? "SHORT" : fresh.mode === "EARN" ? "LONG" : fresh.direction;
    const parlayHint =
      fresh.mode === "PARLAY"
        ? ` · legs: ${parlayLegs.map((l) => l.split("/")[0]).join(", ")}`
        : "";

    try {
      const order = await placeOrder({
        asset: fresh.mode === "PARLAY" ? parlayLegs[0]! : asset,
        mode: fresh.mode,
        wallet: user.address,
        intent: intent + parlayHint,
        sizeUsdc: notional,
        timeHorizonHours: parsedHorizonHours(fresh),
        direction,
        userConvictionPct: fresh.convictionPct,
      });
      toast.success(`Order ${order.id}`, {
        description: `${order.slices.total} stealth slices queued · ${formatHorizon(fresh)}`,
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
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
              Plain English intent
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
          <Field label="What do you want to do?">
            <textarea
              required
              rows={3}
              value={intentText}
              onChange={(e) => setIntentText(e.target.value)}
              placeholder={INTENT_EXAMPLES[0]}
              className="w-full resize-none rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-2.5 text-sm leading-relaxed text-[color:var(--ds-fg)] outline-none ring-[color:var(--ds-accent)] focus:ring-1"
            />
            {intentText.trim() && (
              <p className="mt-2 font-mono text-[11px] text-emerald-400">
                {parsing ? "Parsing intent…" : parsed ? `→ ${formatParsedIntent(parsed)}` : "…"}
              </p>
            )}
            <p className="mt-2 text-[11px] text-[color:var(--ds-muted)]">
              Examples:{" "}
              {INTENT_EXAMPLES.slice(1).map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setIntentText(ex)}
                  className="mr-2 underline decoration-dotted underline-offset-2 hover:text-[color:var(--ds-fg)]"
                >
                  {ex.length > 42 ? `${ex.slice(0, 42)}…` : ex}
                </button>
              ))}
            </p>
          </Field>

          {parsed && (
            <div
              className={`rounded-xl border p-4 ${
                configLocked
                  ? "border-emerald-500/25 bg-emerald-500/5"
                  : "border-amber-500/25 bg-amber-500/5"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--ds-muted)]">
                  {configLocked ? (
                    <>
                      <Lock className="h-3 w-3 text-emerald-500" /> Auto-configured from intent
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3 text-amber-500" /> Manual edit — submit disabled
                    </>
                  )}
                </div>
                {allowManualEdit ? (
                  <button
                    type="button"
                    onClick={() => setAllowManualEdit(false)}
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--ds-fg)] underline"
                  >
                    Use intent settings
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAllowManualEdit(true)}
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--ds-muted)] underline hover:text-[color:var(--ds-fg)]"
                  >
                    Edit manually
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-[color:var(--ds-fg)]">
                {parsed.mode} · {asset} · {horizonLabel()} · {parsed.convictionPct}% conviction
              </p>
              {configLocked && (
                <p className="mt-2 text-[11px] text-[color:var(--ds-muted)]">
                  Strategy, market, and horizon are set from your words. Only size is adjustable
                  below.
                </p>
              )}
            </div>
          )}

          {!parsed && intentText.trim() && parsing && (
            <p className="text-[12px] text-[color:var(--ds-muted)]">
              Reading your intent — configuration unlocks when parsing finishes.
            </p>
          )}

          {parsed && (
            <>
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
                      disabled={configLocked}
                      onClick={() => {
                        setAllowManualEdit(true);
                        setMode(k);
                      }}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs text-[color:var(--ds-fg)] disabled:cursor-not-allowed disabled:opacity-50 ${
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

              {mode === "PARLAY" ? (
                <Field label="Parlay legs (live markets only)">
                  <p className="mb-2 text-[11px] text-[color:var(--ds-muted)]">
                    Pick two or more markets. Your intent text should describe the combined bet.
                  </p>
                  <ul className="space-y-2">
                    {parlayLegs.map((leg, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <TokenIcon asset={leg} className="h-5 w-5 shrink-0" />
                        <select
                          value={leg}
                          disabled={configLocked}
                          onChange={(e) => {
                            setAllowManualEdit(true);
                            setParlayLegs((prev) =>
                              prev.map((x, j) => (j === i ? (e.target.value as typeof leg) : x)),
                            );
                          }}
                          className="veil-select w-full rounded-lg border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-2 font-mono text-sm text-[color:var(--ds-fg)] disabled:opacity-50"
                        >
                          {LIVE_MARKETS.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                        {parlayLegs.length > 1 && !configLocked && (
                          <button
                            type="button"
                            onClick={() => setParlayLegs((prev) => prev.filter((_, j) => j !== i))}
                            className="shrink-0 font-mono text-[10px] uppercase text-[color:var(--ds-muted)]"
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </Field>
              ) : (
                <Field label="Market (live on Predict testnet)">
                  <div className="flex items-center gap-3 rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-2">
                    <TokenIcon asset={asset} className="h-6 w-6" />
                    <select
                      value={asset}
                      disabled={configLocked}
                      onChange={(e) => {
                        setAllowManualEdit(true);
                        setAsset(e.target.value as (typeof LIVE_MARKETS)[number]);
                      }}
                      className="veil-select w-full bg-transparent font-mono text-sm text-[color:var(--ds-fg)] outline-none disabled:opacity-50"
                    >
                      {LIVE_MARKETS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
              )}

              <Field label={`Horizon · ${horizonLabel()}`}>
                <div className="mb-2 flex gap-1 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-1 font-mono text-[10px] uppercase">
                  {(["minutes", "hours", "days"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      disabled={configLocked}
                      onClick={() => {
                        setAllowManualEdit(true);
                        setHorizonUnit(u);
                        setHorizonValue(u === "minutes" ? 15 : 1);
                      }}
                      className={`flex-1 rounded-full px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                        horizonUnit === u
                          ? "bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)]"
                          : "text-[color:var(--ds-muted)]"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  disabled={configLocked}
                  min={horizonUnit === "minutes" ? 15 : 1}
                  max={horizonUnit === "minutes" ? 120 : horizonUnit === "hours" ? 72 : 30}
                  step={horizonUnit === "minutes" ? 15 : 1}
                  value={horizonValue}
                  onChange={(e) => {
                    setAllowManualEdit(true);
                    setHorizonValue(Number(e.target.value));
                  }}
                  className="w-full accent-[color:var(--ds-accent)] disabled:opacity-50"
                />
              </Field>
            </>
          )}

          <Field label={`Size · ${notional} dUSDC`}>
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={notional}
              onChange={(e) => setNotional(Number(e.target.value))}
              className="w-full accent-[color:var(--ds-accent)]"
            />
            <p className="mt-1 text-[11px] text-[color:var(--ds-muted)]">
              Testnet sizes. Fund your manager on Portfolio first.
            </p>
          </Field>

          <p className="text-[12px] text-[color:var(--ds-muted)]">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Type your intent — GPT sets mode, asset, and horizon automatically. Submit only when
            locked to intent.
          </p>
        </div>
        <footer className="flex flex-col gap-2 border-t border-[color:var(--ds-border)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {allowManualEdit && parsed && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber-600 dark:text-amber-400">
              Manual edit active — tap “Use intent settings” to submit
            </p>
          )}
          {!parsed && intentText.trim() && !parsing && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--ds-muted)]">
              Could not parse intent
            </p>
          )}
          <div className="flex justify-end gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border px-4 py-2 font-mono text-[11px] uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-full bg-[color:var(--ds-accent)] px-5 py-2 font-mono text-[11px] font-bold uppercase text-[color:var(--ds-accent-fg)] disabled:opacity-60"
            >
              {submitting ? "Sealing… (up to 3 min)" : parsing ? "Parsing…" : "Submit intent"}
            </button>
          </div>
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
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ds-accent)] px-4 py-2 font-mono text-[11px] font-bold uppercase text-[color:var(--ds-accent-fg)]"
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
