import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteHeader";
import { Reveal } from "@/components/Hero";
import { ENTRIES } from "./journal.entries";

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

function JournalPage() {
  return (
    <PageShell>
      <Reveal>
        <p className="page-eyebrow">Journal · road to mainnet</p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-tight">
          Built in the open.
          <br />
          <em className="page-em">No exits, no edits.</em>
        </h1>
      </Reveal>

      <div className="mt-20 space-y-10">
        {ENTRIES.map((e, i) => (
          <Reveal key={e.date} delay={i * 0.05}>
            <article className="page-divider grid grid-cols-1 gap-4 border-t pt-8 md:grid-cols-12 md:gap-10">
              <div className="md:col-span-3">
                <time className="page-eyebrow">{e.date}</time>
                <div className="page-tag mt-3">{e.tag}</div>
              </div>
              <div className="md:col-span-9">
                <h2 className="font-display text-2xl md:text-3xl">{e.title}</h2>
                <p className="page-body mt-3 text-[15px]">{e.body}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </PageShell>
  );
}
