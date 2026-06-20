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
        content: "Submission June 24 · shortlist July · beta after shortlist.",
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
      "Public attestation viewer at /attest/[hash]",
      "Live discover leaderboard from settled orders",
      "Waitlist + judge access gate for public deploy",
    ],
  },
  {
    range: "Jun 21–24",
    title: "DeepSurge submission",
    status: "active",
    items: [
      "Demo video + judge README (docs/JUDGES.md)",
      "DeepSurge submission — deadline June 24, 2026",
      "Public site: waitlist only until shortlist",
    ],
  },
  {
    range: "Jun 24 → Jul",
    title: "Community build",
    status: "next",
    items: [
      "Daily X content post-submission (build-in-public arc)",
      "Telegram community for beta waitlist",
      "Shortlist announced in July — then beta invites roll out",
    ],
  },
  {
    range: "Post-shortlist",
    title: "Beta + mainnet path",
    status: "later",
    items: [
      "Waitlist → dashboard invites in waves",
      "Independent TEE + Move audits",
      "Mainnet DeepBook Predict integration",
      "Open keeper network",
    ],
  },
];

const BADGE: Record<Phase["status"], { label: string; cls: string }> = {
  shipped: { label: "SHIPPED", cls: "bg-white text-black" },
  active: { label: "IN FLIGHT", cls: "bg-white/15 text-white" },
  next: { label: "NEXT", cls: "border border-white/20 text-white/80" },
  later: { label: "LATER", cls: "border border-white/10 text-white/50" },
};

function RoadmapPage() {
  return (
    <PageShell>
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
          Roadmap · Submit June 24 · Shortlist July
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-tight">
          Submission to
          <br />
          <em className="italic text-white/64">beta launch.</em>
        </h1>
        <p className="mt-8 max-w-[640px] text-[clamp(1rem,1.4vw,1.2rem)] leading-relaxed text-white/72">
          DeepSurge deadline is June 24. After submission we go active on X and Telegram. When
          shortlist drops in July, waitlist members get dashboard access in waves.
        </p>
      </Reveal>

      <div className="mt-24 space-y-6">
        {PHASES.map((phase, i) => (
          <Reveal key={phase.range} delay={i * 0.06}>
            <article className="grid grid-cols-1 gap-6 border-t border-white/10 pt-8 md:grid-cols-12 md:gap-10">
              <div className="md:col-span-3">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                  {phase.range}
                </div>
                <h2 className="mt-3 font-display text-3xl leading-tight">{phase.title}</h2>
                <span
                  className={`mt-4 inline-block px-3 py-1 font-mono text-[10px] tracking-[0.2em] ${BADGE[phase.status].cls}`}
                >
                  {BADGE[phase.status].label}
                </span>
              </div>
              <ul className="space-y-3 md:col-span-9">
                {phase.items.map((it) => (
                  <li key={it} className="flex gap-4 text-[15px] leading-relaxed text-white/80">
                    <span aria-hidden className="mt-2 h-px w-6 shrink-0 bg-white/30" />
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
