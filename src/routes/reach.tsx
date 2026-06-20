import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteHeader";
import { Reveal, SegmentedCTA } from "@/components/Hero";

export const Route = createFileRoute("/reach")({
  head: () => ({
    meta: [
      { title: "Reach Us — Veil" },
      {
        name: "description",
        content: "Talk to Veil — traders, partners, institutions.",
      },
      { property: "og:title", content: "Reach Us — Veil" },
      {
        property: "og:description",
        content: "Talk to Veil — traders, partners, institutions.",
      },
    ],
  }),
  component: ReachPage,
});

function ReachPage() {
  const [sent, setSent] = useState(false);

  return (
    <PageShell>
      <Reveal>
        <p className="page-eyebrow">Reach Us</p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-tight">
          Drop a signal.
          <br />
          <em className="page-em">We&apos;ll answer in silence.</em>
        </h1>
      </Reveal>

      <div className="mt-20 grid gap-16 md:grid-cols-12">
        <Reveal delay={0.1} className="md:col-span-5">
          <ul className="space-y-8 font-mono text-sm">
            {[
              ["X / TWITTER", "@veilonsui"],
              ["TELEGRAM", "t.me/veilonsui"],
              ["DISCORD", "Community link at launch"],
            ].map(([k, v]) => (
              <li key={k} className="page-divider border-l pl-6">
                <div className="page-eyebrow-sm">{k}</div>
                <div className="mt-1">{v}</div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.2} className="md:col-span-7">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="page-form-box space-y-6 p-8"
          >
            <div>
              <label className="page-eyebrow-sm">Name</label>
              <input required type="text" className="page-field-line mt-2 py-3" />
            </div>
            <div>
              <label className="page-eyebrow-sm">Email or Sui address</label>
              <input required type="text" className="page-field-line mt-2 py-3" />
            </div>
            <div>
              <label className="page-eyebrow-sm">Message</label>
              <textarea required rows={5} className="page-field-line mt-2 resize-none py-3" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="page-eyebrow text-[11px] normal-case tracking-normal">
                {sent ? "Received. We'll be in touch." : "Encrypted in transit."}
              </span>
              <SegmentedCTA label={sent ? "SENT" : "SEND SIGNAL"} variant="solid" />
            </div>
          </form>
        </Reveal>
      </div>
    </PageShell>
  );
}
