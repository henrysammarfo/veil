import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteHeader";
import { Reveal } from "@/components/Hero";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Veil" },
      {
        name: "description",
        content:
          "Build logs from the road to Sui Overflow and DeepBook mainnet.",
      },
      { property: "og:title", content: "Journal — Veil" },
      {
        property: "og:description",
        content: "Build logs from the road to Sui Overflow and mainnet.",
      },
    ],
  }),
  component: JournalPage,
});

const ENTRIES = [
  {
    date: "2026-06-11",
    tag: "FRONTEND",
    title: "Site routes + mock auth landed",
    body: "Header now routes via TanStack Link. Mock zkLogin / wallet / email session ships behind an interface that maps 1:1 to Enoki when the API key drops in.",
  },
  {
    date: "2026-06-09",
    tag: "ENGINE",
    title: "Kelly sizing wired to SVI back-solve",
    body: "Agent 4 now reads {a,b,rho,m,sigma,t} from OracleSVIUpdated and sizes Bull Mode positions via (p − q/b) × balance.",
  },
  {
    date: "2026-06-07",
    tag: "TEE",
    title: "Nitro Enclave attestation verified on-chain",
    body: "Move verifier reads PCR0/PCR1/PCR2 and rejects mismatched enclaves. ExecutionProof is now a first-class Sui object.",
  },
  {
    date: "2026-06-04",
    tag: "WALRUS",
    title: "MemWal report shape locked",
    body: "Every slice, fill, and decision serialized to a single archive blob. Shareable at walrus.site/veil-report/[user_address].",
  },
  {
    date: "2026-06-01",
    tag: "KICKOFF",
    title: "Veil — Day Zero",
    body: "12-day build plan signed off. Targeting DeepSurge submission on June 19, two days before the hackathon deadline.",
  },
];

function JournalPage() {
  return (
    <PageShell>
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
          Journal · road to mainnet
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-tight">
          Built in the open.<br />
          <em className="italic text-white/64">No exits, no edits.</em>
        </h1>
      </Reveal>

      <div className="mt-20 space-y-10">
        {ENTRIES.map((e, i) => (
          <Reveal key={e.date} delay={i * 0.05}>
            <article className="grid grid-cols-1 gap-4 border-t border-white/10 pt-8 md:grid-cols-12 md:gap-10">
              <div className="md:col-span-3">
                <time className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                  {e.date}
                </time>
                <div className="mt-3 inline-block bg-white/10 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-white/80">
                  {e.tag}
                </div>
              </div>
              <div className="md:col-span-9">
                <h2 className="font-display text-2xl md:text-3xl">{e.title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-white/72">
                  {e.body}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </PageShell>
  );
}
