import { useCallback, useEffect, useState } from "react";
import { Check, Sparkles, X, Activity, ShieldCheck, Archive, Compass } from "lucide-react";
import { DSCard } from "@/components/DashboardShell";
import { StepTooltip } from "@/components/dashboard/StepTooltip";
import { useAuth } from "@/lib/auth/AuthProvider";
import { fetchPrefs, savePrefs } from "@/lib/veil/prefs";

/**
 * 4-step onboarding checklist. Progress persists server-side per wallet (no localStorage).
 */

const STEPS = [
  {
    id: "order",
    icon: Activity,
    title: "Place your first stealth order",
    body: "Describe an intent — Veil's enclave slices it into private trades the market can't front-run.",
    cta: "Open Orders",
    to: "/dashboard/orders",
  },
  {
    id: "proof",
    icon: ShieldCheck,
    title: "Open the proof console",
    body: "Every fill is signed by a TEE. The PCR0 hash is posted to Sui — anyone can verify Veil ran what it claims.",
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

export function OnboardingChecklist() {
  const { user } = useAuth();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user?.address) return;
    void fetchPrefs(user.address).then((p) => {
      setDone(p.onboardingSteps ?? {});
      setDismissed(!!p.onboardingDismissed);
    });
  }, [user?.address]);

  const persist = useCallback(
    (patch: { onboardingSteps?: Record<string, boolean>; onboardingDismissed?: boolean }) => {
      if (!user?.address) return;
      void savePrefs(user.address, patch);
    },
    [user?.address],
  );

  function mark(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: true };
      persist({ onboardingSteps: next });
      return next;
    });
  }

  function dismiss() {
    setDismissed(true);
    persist({ onboardingDismissed: true });
  }

  if (dismissed || !user?.address) return null;
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
                      <div
                        className={`font-display text-base leading-tight ${isDone ? "line-through opacity-60" : ""}`}
                      >
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
