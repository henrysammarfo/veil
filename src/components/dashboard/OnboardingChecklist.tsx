import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Sparkles, X, Activity, ShieldCheck, Archive, Compass } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import { fetchPrefs, savePrefs } from "@/lib/veil/prefs";

const STEPS = [
  {
    id: "order",
    icon: Activity,
    title: "Place your first stealth order",
    body: "Describe an intent in plain English. Veil's enclave slices it into private trades the market cannot front-run.",
    cta: "Open Orders",
    to: "/dashboard/orders",
  },
  {
    id: "proof",
    icon: ShieldCheck,
    title: "Open the proof console",
    body: "Every fill is signed by a TEE. The PCR0 hash is posted to Sui so anyone can verify Veil ran what it claims.",
    cta: "View Proofs",
    to: "/dashboard/proofs",
  },
  {
    id: "archive",
    icon: Archive,
    title: "Inspect the Walrus archive",
    body: "Each day, orders, proofs, and fills are sealed on Walrus as a permanent public receipt.",
    cta: "Open Archive",
    to: "/dashboard/liquidity",
  },
  {
    id: "discover",
    icon: Compass,
    title: "Discover top leaders",
    body: "Browse wallets the enclave shadows. Copy any address into a stealth order intent.",
    cta: "Discover",
    to: "/dashboard/discover",
  },
] as const;

/** First-run wizard modal. Dismiss or finish persists server-side; card never returns. */
export function OnboardingChecklist() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.address) return;
    void fetchPrefs(user.address).then((p) => {
      const done = p.onboardingWizardDone || p.onboardingDismissed;
      if (!done) {
        setStep(0);
        setVisible(true);
      }
    });
  }, [user?.address]);

  const finish = useCallback(
    (patch: { onboardingWizardDone?: boolean; onboardingDismissed?: boolean }) => {
      if (!user?.address) return;
      setVisible(false);
      void savePrefs(user.address, patch);
    },
    [user?.address],
  );

  if (!visible || !user?.address) return null;

  const current = STEPS[step]!;
  const Icon = current.icon;
  const isLast = step >= STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => finish({ onboardingWizardDone: true, onboardingDismissed: true })}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-surface)] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => finish({ onboardingWizardDone: true, onboardingDismissed: true })}
          aria-label="Dismiss onboarding"
          className="absolute right-4 top-4 text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 pr-8">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
            Welcome · step {step + 1} of {STEPS.length}
          </span>
        </div>

        <div className="mt-5 grid h-10 w-10 place-items-center rounded-full border border-[color:var(--ds-border)]">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="mt-4 font-display text-xl leading-tight">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--ds-muted)]">{current.body}</p>

        <div className="mt-5 flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-amber-400" : "bg-[color:var(--ds-pill)]"}`}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            to={current.to as never}
            onClick={() => finish({ onboardingWizardDone: true, onboardingDismissed: true })}
            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ds-accent)] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--ds-accent-fg)]"
          >
            {current.cta} <ArrowRight className="h-3 w-3" />
          </Link>
          {!isLast ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-full border border-[color:var(--ds-border)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em]"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={() => finish({ onboardingWizardDone: true, onboardingDismissed: true })}
              className="rounded-full border border-[color:var(--ds-border)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em]"
            >
              Done
            </button>
          )}
          <button
            type="button"
            onClick={() => finish({ onboardingWizardDone: true, onboardingDismissed: true })}
            className="ml-auto font-mono text-[10px] uppercase tracking-[0.15em] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}
