import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteHeader";
import { Reveal } from "@/components/Hero";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Veil" },
      {
        name: "description",
        content: "Build logs from the road to Sui Overflow and DeepBook mainnet.",
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
    date: "2026-06-17",
    tag: "SHIP",
    title: "Four modes live + judge gate",
    body: "BULL/BEAR/EARN/PARLAY execute on Azure enclave. Public deploy is waitlist-only; judges unlock via access code. Live leaderboard and /attest viewer shipped.",
  },
  {
    date: "2026-06-15",
    tag: "PNL",
    title: "Realized PnL from keeper redeems",
    body: "Settlement sync distinguishes expected vs realized profit. Dashboard shows STEALTH badge and color-coded outcomes per order.",
  },
  {
    date: "2026-06-11",
    tag: "AUTH",
    title: "Enoki zkLogin + server-side prefs",
    body: "Google sign-in derives a sponsored zkLogin wallet. Theme, mode, and onboarding persist via API — no localStorage.",
  },
  {
    date: "2026-06-07",
    tag: "TEE",
    title: "Nitro attestation on Azure",
    body: "Move verifier reads PCR0/1/2 and rejects mismatched enclaves. ExecutionProof is a first-class Sui object.",
  },
  {
    date: "2026-06-01",
    tag: "KICKOFF",
    title: "Veil — Day Zero",
    body: "Build plan signed off for Sui Overflow 2026. Targeting DeepSurge submission June 24, shortlist July, beta after.",
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
          Built in the open.
          <br />
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
                <p className="mt-3 text-[15px] leading-relaxed text-white/72">{e.body}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </PageShell>
  );
}
