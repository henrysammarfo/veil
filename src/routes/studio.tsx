import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteHeader";
import { Reveal, SegmentedCTA } from "@/components/Hero";
import { marketingActionLabel, marketingActionPath } from "@/lib/access";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Studio — Veil" },
      {
        name: "description",
        content:
          "Inside the Veil Studio — the execution engine, agents, and TEE primitives powering stealth trades on DeepBook.",
      },
      { property: "og:title", content: "Studio — Veil" },
      {
        property: "og:description",
        content:
          "Inside the Veil Studio — the execution engine, agents, and TEE primitives powering stealth trades.",
      },
    ],
  }),
  component: StudioPage,
});

const PILLARS = [
  {
    n: "01",
    title: "Intent Layer",
    body: "Plain-English intents are parsed by LLM in the enclave, then executed as on-chain TWAP slices on DeepBook Predict testnet — one mint per slice.",
  },
  {
    n: "02",
    title: "Stealth Execution",
    body: "Orders slice inside an Azure Nitro enclave. The mempool never sees parent size or direction until settlement.",
  },
  {
    n: "03",
    title: "Provable Settlement",
    body: "Every fill emits a Move ExecutionProof on Sui. Reports archive to Walrus MemWal — replay any decision publicly at /attest/[hash].",
  },
];

function StudioPage() {
  return (
    <PageShell>
      <Reveal>
        <p className="page-eyebrow">The Studio · Veil Engine v0</p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-tight">
          Four modes.
          <br />
          <em className="page-em">One private fill.</em>
        </h1>
      </Reveal>

      <div className="mt-16 grid gap-10 md:grid-cols-12">
        <Reveal delay={0.1} className="md:col-span-7">
          <p className="page-body text-[clamp(1rem,1.4vw,1.25rem)]">
            The Studio is the cockpit. Type any market view in English — Veil converts it to an
            optimally-timed DeepBook Predict position, slices it across volatility, executes inside
            a Nautilus TEE, and posts a cryptographic proof on-chain. No mempool exposure. No
            reputational trust. Just hardware-attested execution.
          </p>
        </Reveal>
        <Reveal delay={0.2} className="md:col-span-5">
          <div className="page-divider border-l pl-6">
            <div className="page-eyebrow-sm">Live testnet</div>
            <div className="mt-3 font-display text-3xl">DeepBook Predict</div>
            <p className="page-muted mt-3 text-sm">
              Branch: <span className="font-mono">predict-testnet-4-16</span>
              <br />
              Indexer: predict-server.testnet.mystenlabs.com
            </p>
          </div>
        </Reveal>
      </div>

      <div className="mt-32 grid grid-cols-1 gap-10 md:grid-cols-3">
        {PILLARS.map((p, i) => (
          <Reveal key={p.n} delay={0.1 + i * 0.1}>
            <div className="page-divider border-t pt-8">
              <div className="page-muted mb-2 text-3xl font-light">{p.n}</div>
              <h3 className="mb-3 text-xl font-medium">{p.title}</h3>
              <p className="page-body text-[14px]">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="page-divider mt-32 border-t pt-16">
        <Reveal>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.1] tracking-tight">
            Four modes. <em className="page-em">One engine.</em>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              tag: "BULL",
              h: "Directional stealth fill",
              p: "Long or short conviction. Kelly-sized slices execute inside the TEE; settlement posts ExecutionProof on-chain.",
            },
            {
              tag: "BEAR",
              h: "PLP + tail hedge",
              p: "Yield in choppy regimes with documented APY, drawdown caps, and binary tail overlay.",
            },
            {
              tag: "EARN",
              h: "Auto-compound supply",
              p: "Keeper redeems and re-supplies dUSDC each epoch. Minimum 10 dUSDC per supply.",
            },
            {
              tag: "PARLAY",
              h: "Multi-leg correlation",
              p: "Correlated legs sized together; edge and conviction recorded as a single attested execution.",
            },
          ].map((m, i) => (
            <Reveal key={m.tag} delay={0.1 + i * 0.1}>
              <div className="page-form-box p-8 backdrop-blur-[60px]">
                <div className="page-eyebrow-sm">{m.tag}</div>
                <h3 className="mt-4 font-display text-2xl">{m.h}</h3>
                <p className="page-muted mt-4 text-sm">{m.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-24 flex flex-wrap items-center gap-6">
        <Reveal>
          <SegmentedCTA
            label={marketingActionLabel()}
            variant="solid"
            to={marketingActionPath()}
          />
        </Reveal>
      </div>
    </PageShell>
  );
}
