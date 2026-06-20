import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteHeader";
import { Reveal, SegmentedCTA } from "@/components/Hero";
import { dashboardEntryPath } from "@/lib/access";

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
    body: "Plain-English intents map to BULL, BEAR, EARN, or PARLAY modes — sized against live Oracle SVI on DeepBook Predict testnet.",
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
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
          The Studio · Veil Engine v0
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-tight">
          Four modes.
          <br />
          <em className="italic text-white/64">One private fill.</em>
        </h1>
      </Reveal>

      <div className="mt-16 grid gap-10 md:grid-cols-12">
        <Reveal delay={0.1} className="md:col-span-7">
          <p className="text-[clamp(1rem,1.4vw,1.25rem)] leading-relaxed text-white/72">
            The Studio is the cockpit. Type any market view in English — Veil converts it to an
            optimally-timed DeepBook Predict position, slices it across volatility, executes inside
            a Nautilus TEE, and posts a cryptographic proof on-chain. No mempool exposure. No
            reputational trust. Just hardware-attested execution.
          </p>
        </Reveal>
        <Reveal delay={0.2} className="md:col-span-5">
          <div className="border-l border-white/10 pl-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              Live testnet
            </div>
            <div className="mt-3 font-display text-3xl">DeepBook Predict</div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
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
            <div className="border-t border-white/20 pt-8">
              <div className="mb-2 text-3xl font-light">{p.n}</div>
              <h3 className="mb-3 text-xl font-medium">{p.title}</h3>
              <p className="text-[14px] leading-relaxed text-white/72">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-32 border-t border-white/10 pt-16">
        <Reveal>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.1] tracking-tight">
            Four modes. <em className="italic text-white/64">One engine.</em>
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
              <div className="bg-white/[0.03] p-8 backdrop-blur-[60px]">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {m.tag}
                </div>
                <h3 className="mt-4 font-display text-2xl">{m.h}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/70">{m.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-24 flex flex-wrap items-center gap-6">
        <Reveal>
          <SegmentedCTA label="OPEN DASHBOARD" variant="solid" to={dashboardEntryPath()} />
        </Reveal>
      </div>
    </PageShell>
  );
}
