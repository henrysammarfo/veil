import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteHeader";
import { Reveal } from "@/components/Hero";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Veil" },
      {
        name: "description",
        content:
          "Veil is built for Sui Overflow 2026 — the missing private execution layer for DeepBook Predict.",
      },
      { property: "og:title", content: "About — Veil" },
      {
        property: "og:description",
        content: "Veil is the missing private execution layer for DeepBook Predict on Sui.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <Reveal>
        <p className="page-eyebrow">About</p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-tight">
          The private market
          <br />
          <em className="page-em">DeFi never had.</em>
        </h1>
      </Reveal>

      <div className="mt-20 grid gap-16 md:grid-cols-12">
        <Reveal delay={0.1} className="md:col-span-7">
          <p className="page-body text-[clamp(1rem,1.4vw,1.25rem)]">
            Front-running has cost DeFi traders billions. TradFi solved this 30 years ago with
            TWAP/VWAP and dark pools — institutions pay $500K/year for it. On-chain, it has never
            existed, because public ledgers make every order visible. Until Nautilus TEE.
          </p>
          <p className="page-body mt-6 text-[clamp(1rem,1.4vw,1.25rem)]">
            Veil is the only Sui Overflow submission that pairs vol-surface intelligence with
            private, attested execution and permanent on-chain proof. Consumer app, pro trading
            tool, and institutional infrastructure — at the same time.
          </p>
        </Reveal>

        <Reveal delay={0.2} className="md:col-span-5">
          <dl className="page-divider space-y-6 border-l pl-6 font-mono text-sm">
            <div>
              <dt className="page-eyebrow-sm">Track</dt>
              <dd className="mt-1">DeepBook · Sui Overflow 2026</dd>
            </div>
            <div>
              <dt className="page-eyebrow-sm">Prize Target</dt>
              <dd className="mt-1">$35,000 first prize</dd>
            </div>
            <div>
              <dt className="page-eyebrow-sm">Builder</dt>
              <dd className="mt-1">Veil team — Sui Overflow 2026</dd>
            </div>
            <div>
              <dt className="page-eyebrow-sm">Stack</dt>
              <dd className="mt-1">
                Nautilus TEE · DeepBook Predict · Walrus MemWal · Seal · Gasless USDC
              </dd>
            </div>
          </dl>
        </Reveal>
      </div>

      <div className="page-divider mt-32 border-t pt-16">
        <Reveal>
          <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.1] tracking-tight">
            What every other team is missing.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {[
            ["Most teams", "Basic vault strategies — technical demos, no UX layer."],
            ["Several teams", "Trading frontends — transparent, no private execution."],
            ["A few teams", "Vol-surface dashboards — informational only."],
            ["Zero teams", "Nautilus TEE for private execution. That gap is Veil."],
          ].map(([k, v], i) => (
            <Reveal key={k} delay={0.05 * i}>
              <div className="page-divider flex gap-6 border-t pt-6">
                <span className="page-eyebrow-sm shrink-0">{k}</span>
                <span className="page-body text-[15px]">{v}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
