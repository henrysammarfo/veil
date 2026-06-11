import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteHeader";
import { Reveal } from "@/components/Hero";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — Veil" },
      {
        name: "description",
        content:
          "The Veil roadmap — from Sui Overflow 2026 hackathon to DeepBook mainnet.",
      },
      { property: "og:title", content: "Roadmap — Veil" },
      {
        property: "og:description",
        content: "Hackathon to mainnet — the Veil delivery timeline.",
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
    range: "Days 1–4",
    title: "Foundations",
    status: "shipped",
    items: [
      "Nautilus TEE scaffold + AWS Nitro Enclave attestation",
      "DeepBook Predict integration on predict-testnet-4-16",
      "Move verifier contract: ExecutionProof object",
      "gRPC subscription to OracleSVIUpdated",
    ],
  },
  {
    range: "Days 5–8",
    title: "Three-Mode Engine",
    status: "active",
    items: [
      "Bull Mode: Kelly sizing + SVI back-solve + sliced TEE execution",
      "Bear Mode: PLP + binary tail hedge with documented APY/drawdown",
      "Earn Mode: auto-compound keeper with MEV resistance",
      "Seal: encrypted order state survives TEE restarts",
    ],
  },
  {
    range: "Days 9–10",
    title: "Proof & Archive",
    status: "next",
    items: [
      "MemWal execution reports — every slice, every fill, forever",
      "Gasless USDC path — zero SUI required for end users",
      "Public attestation viewer at walrus.site/veil-report/[user]",
    ],
  },
  {
    range: "Days 11–12",
    title: "Frontend + Demo",
    status: "next",
    items: [
      "Three distinct UX flows (Noob / Power / Institution)",
      "5-minute demo video + clean public README",
      "DeepSurge submission — target June 19, deadline June 21",
    ],
  },
  {
    range: "Post-Hack",
    title: "Mainnet Path",
    status: "later",
    items: [
      "Independent TEE audit + Move contract audit",
      "Mainnet rollout against DeepBook Predict v1",
      "Open keeper network + institutional onboarding",
      "Cross-DEX intent routing (DeepBook ↔ Polymarket arb)",
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
          Roadmap · Deadline June 21, 2026
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-tight">
          Hackathon to<br />
          <em className="italic text-white/64">mainnet.</em>
        </h1>
        <p className="mt-8 max-w-[640px] text-[clamp(1rem,1.4vw,1.2rem)] leading-relaxed text-white/72">
          A delivery plan tight enough to win Sui Overflow 2026, and a path
          straight through to a mainnet DeepBook integration. Every milestone
          tracked publicly in the Journal.
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
                <h2 className="mt-3 font-display text-3xl leading-tight">
                  {phase.title}
                </h2>
                <span
                  className={`mt-4 inline-block px-3 py-1 font-mono text-[10px] tracking-[0.2em] ${BADGE[phase.status].cls}`}
                >
                  {BADGE[phase.status].label}
                </span>
              </div>
              <ul className="space-y-3 md:col-span-9">
                {phase.items.map((it) => (
                  <li
                    key={it}
                    className="flex gap-4 text-[15px] leading-relaxed text-white/80"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-px w-6 shrink-0 bg-white/30"
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
