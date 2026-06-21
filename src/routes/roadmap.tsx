import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteHeader";
import { Reveal } from "@/components/Hero";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — Veil" },
      {
        name: "description",
        content: "The Veil roadmap — Sui Overflow 2026 submission through beta launch.",
      },
      { property: "og:title", content: "Roadmap — Veil" },
      {
        property: "og:description",
        content: "Submitted June 21 · Shortlist July · Demo Day July 20–21.",
      },
    ],
  }),
  component: RoadmapPage,
});

type Phase = {
  range: string;
  title: string;
  status: "shipped" | "active" | "next" | "later";
  items: string[];
};

const PHASES: Phase[] = [
  {
    range: "Jun 1–12",
    title: "Core engine",
    status: "shipped",
    items: [
      "Azure Nitro enclave + attested execution on predict-testnet-4-16",
      "Move ExecutionProof + parlay recording on Sui testnet",
      "All four modes live: BULL, BEAR, EARN, PARLAY",
      "Keeper settlement + realized PnL sync",
    ],
  },
  {
    range: "Jun 13–20",
    title: "Product + proof",
    status: "shipped",
    items: [
      "Dashboard with Enoki zkLogin + sponsored txs",
      "User-owned PredictManager — deposit, withdraw, redeem on Portfolio",
      "LLM plain-English intent parsing (enclave + API)",
      "Full on-chain TWAP — one Predict mint per slice, no simulated fills",
      "Public attestation viewer at /attest/[hash]",
      "Live discover leaderboard from settled orders",
      "Waitlist site + separate reviewer app for DeepSurge judges (no access code)",
    ],
  },
  {
    range: "Jun 21",
    title: "Sui Overflow submission",
    status: "shipped",
    items: [
      "Demo video: youtu.be/byFuYmAPL6Q",
      "DeepSurge form submitted — Special · DeepBook track",
      "Live demo: veil-reviewer.vercel.app — wallet/Google → Portfolio → trade",
      "Judge path: docs/JUDGES.md (no repo clone)",
    ],
  },
  {
    range: "Jul",
    title: "Shortlist + community",
    status: "active",
    items: [
      "Shortlist announced — beta invites roll out in waves",
      "Daily X + Telegram build-in-public arc",
      "Open dashboard to waitlist cohorts after shortlist",
    ],
  },
  {
    range: "Post-shortlist",
    title: "Beta + monetization",
    status: "later",
    items: [
      "Execution fees on stealth fills (bps on notional)",
      "Spread / slippage savings capture shared with protocol",
      "EARN yield share on keeper-compounded PLP drip",
      "Independent TEE + Move audits",
      "Mainnet DeepBook Predict integration",
      "Open keeper network",
    ],
  },
  {
    range: "Phase 2",
    title: "Custom strategies",
    status: "later",
    items: [
      "Strategy plugin registry inside the TEE — same stealth + attestation guarantees",
      "Bring-your-own signals (Polymarket gap, external conviction, risk caps)",
      "Pluggable execution slicers: TWAP, passive, iceberg",
      "Power-user params: max drawdown, Kelly fraction, reserve rules",
      "Publish strategies to Discover — others route through your engine",
      "Capital stays in user PredictManager — strategies never custody funds",
    ],
  },
];

const BADGE: Record<Phase["status"], { label: string; cls: string }> = {
  shipped: { label: "SHIPPED", cls: "bg-[var(--site-cta-bg)] text-[var(--site-cta-fg)]" },
  active: { label: "IN FLIGHT", cls: "page-tag" },
  next: { label: "NEXT", cls: "page-tag" },
  later: { label: "LATER", cls: "page-tag opacity-70" },
};

function RoadmapPage() {
  return (
    <PageShell>
      <Reveal>
        <p className="page-eyebrow">Roadmap · Submitted June 21 · Demo Day July 20–21</p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-tight">
          Submission to
          <br />
          <em className="page-em">beta launch.</em>
        </h1>
        <p className="page-body mt-8 max-w-[640px] text-[clamp(1rem,1.4vw,1.2rem)]">
          Sui Overflow submitted June 21 (6 PM Pacific deadline). Four built-in modes live on
          testnet; Phase 2 opens the engine to custom strategies. Shortlist in early July, then
          beta invites in waves.
        </p>
      </Reveal>

      <div className="mt-24 space-y-6">
        {PHASES.map((phase, i) => (
          <Reveal key={phase.range} delay={i * 0.06}>
            <article className="page-divider grid grid-cols-1 gap-6 border-t pt-8 md:grid-cols-12 md:gap-10">
              <div className="md:col-span-3">
                <div className="page-eyebrow">{phase.range}</div>
                <h2 className="mt-3 font-display text-3xl leading-tight">{phase.title}</h2>
                <span className={`mt-4 inline-block font-mono text-[10px] tracking-[0.2em] ${BADGE[phase.status].cls}`}>
                  {BADGE[phase.status].label}
                </span>
              </div>
              <ul className="space-y-3 md:col-span-9">
                {phase.items.map((it) => (
                  <li key={it} className="page-body flex gap-4 text-[15px]">
                    <span
                      aria-hidden
                      className="mt-2 h-px w-6 shrink-0 bg-[color:var(--site-border)]"
                    />
                    {it}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </PageShell>
  );
}
