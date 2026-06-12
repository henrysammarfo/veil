import { useEffect, useState } from "react";
import { Check, Sparkles, X, Activity, ShieldCheck, Archive, Compass } from "lucide-react";
import { DSCard } from "@/components/DashboardShell";
import { StepTooltip } from "@/components/dashboard/StepTooltip";

/**
 * 4-step onboarding checklist. Each step opens a contextual tooltip that
 * links to the relevant widget; dismissing the tooltip marks the step done.
 * Both the per-step "done" map and the overall dismissal persist in
 * localStorage so a returning user never sees this twice.
 */

const STEPS = [
  {
    id: "order",
    icon: Activity,
    title: "Place your first stealth order",
    body:
      "Describe an intent — Veil's enclave slices it into private trades the market can't front-run.",
    cta: "Open Orders",
    to: "/dashboard/orders",
  },
  {
    id: "proof",
    icon: ShieldCheck,
    title: "Open the proof console",
    body:
      "Every fill is signed by a TEE. The PCR0 hash is posted to Sui — anyone can verify Veil ran what it claims.",
    cta: "View Proofs",
    to: "/dashboard/proofs",
  },
  {
    id: "archive",
    icon: Archive,
    title: "Inspect the Walrus archive",
    body: "Each day, all orders + proofs + fills are sealed on Walrus — a permanent, public receipt.",
    cta: "Open Archive",
    to: "/dashboard/liquidity",
  },
  {
    id: "discover",
    icon: Compass,
    title: "Discover top leaders",
    body: "Browse the wallets the enclave is shadowing. Copy any address into a stealth-order intent.",
    cta: "Discover",
    to: "/dashboard/discover",
  },
] as const;

const KEY_STEPS = "veil.onboard.steps";
const KEY_DISMISS = "veil.onboard.dismissed";

function readSteps(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(KEY_STEPS);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch { /* ignore */ }
  return {};
}

export function OnboardingChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDone(readSteps());
    setDismissed(window.localStorage.getItem(KEY_DISMISS) === "1");
  }, []);

  function mark(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: true };
      try { window.localStorage.setItem(KEY_STEPS, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }
  function dismiss() {
    setDismissed(true);
    try { window.localStorage.setItem(KEY_DISMISS, "1"); } catch { /* ignore */ }
  }

  if (dismissed) return null;
  const completedCount = STEPS.filter((s) => done[s.id]).length;
  const pct = (completedCount / STEPS.length) * 100;

  return (
    <DSCard className="relative">
      <button
        onClick={dismiss}
        aria-label="Dismiss onboarding"
        className="absolute right-4 top-4 text-[color:var(--ds-muted)] transition-colors hover:text-[color:var(--ds-fg)]"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-wrap items-end justify-between gap-4 pr-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
              Welcome to Veil · 4-step tour
            </span>
          </div>
          <h2 className="mt-3 font-display text-[clamp(1.5rem,2.5vw,2rem)] leading-tight">
            Get the cockpit working for you.
          </h2>
          <p className="mt-2 max-w-md text-[12px] leading-relaxed text-[color:var(--ds-muted)]">
            Tap any step for a quick explainer. Closing a tip marks it as read.
          </p>
        </div>
        <div className="font-mono text-[11px] text-[color:var(--ds-muted)]">
          {completedCount} / {STEPS.length} done
        </div>
      </div>

      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[color:var(--ds-pill)]">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {STEPS.map((s) => {
          const isDone = !!done[s.id];
          const Icon = s.icon;
          return (
            <li key={s.id} className="relative">
              <StepTooltip
                title={s.title}
                body={s.body}
                to={s.to}
                ctaLabel={s.cta}
                onDismiss={() => mark(s.id)}
                trigger={
                  <div
                    className={`group flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                      isDone
                        ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                        : "border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] hover:bg-[color:var(--ds-hover)]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                        isDone
                          ? "border-emerald-400 bg-emerald-400 text-black"
                          : "border-[color:var(--ds-border)] text-[color:var(--ds-muted)]"
                      }`}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className={`font-display text-base leading-tight ${isDone ? "line-through opacity-60" : ""}`}>
                        {s.title}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[color:var(--ds-muted)]">
                        {s.body}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.15em] text-[color:var(--ds-fg)]">
                        {s.cta} →
                      </span>
                    </div>
                  </div>
                }
              />
            </li>
          );
        })}
      </ul>
    </DSCard>
  );
}
