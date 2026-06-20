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
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Reach Us</p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-tight">
          Drop a signal.
          <br />
          <em className="italic text-white/64">We'll answer in silence.</em>
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
              <li key={k} className="border-l border-white/10 pl-6">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</div>
                <div className="mt-1 text-white">{v}</div>
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
            className="space-y-6 bg-white/[0.03] p-8 backdrop-blur-[60px]"
          >
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Name
              </label>
              <input
                required
                type="text"
                className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-white outline-none focus:border-white"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Email or Sui address
              </label>
              <input
                required
                type="text"
                className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-white outline-none focus:border-white"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Message
              </label>
              <textarea
                required
                rows={5}
                className="mt-2 w-full resize-none border-b border-white/20 bg-transparent py-3 text-white outline-none focus:border-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-white/40">
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
