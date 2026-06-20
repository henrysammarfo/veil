import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/SiteHeader";
import { Reveal } from "@/components/Hero";
import { joinWaitlist, fetchWaitlistCount } from "@/lib/veil/waitlist";
import { reviewerAppUrl } from "@/lib/access";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Waitlist — Veil" },
      {
        name: "description",
        content: "Join the Veil waitlist for updates on stealth execution for DeepBook Predict.",
      },
    ],
  }),
  loader: async () => {
    try {
      return { count: await fetchWaitlistCount() };
    } catch {
      return { count: 0 };
    }
  },
  component: WaitlistPage,
});

type Experience = "new" | "trader" | "power";

function WaitlistPage() {
  const { count } = Route.useLoaderData();
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState("");
  const [experience, setExperience] = useState<Experience>("new");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      await joinWaitlist({ email, wallet: wallet || undefined, experience });
      setStatus("done");
      setMessage("You're on the list. We'll email you if a beta wave opens.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <PageShell>
      <Reveal>
        <p className="page-eyebrow">Waitlist</p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,4rem)] font-medium leading-[1.05] tracking-tight">
          Get updates.
        </h1>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="page-body mt-6 max-w-xl text-[16px]">
          Veil is in DeepSurge review. Join the waitlist for launch news — no guarantee of
          shortlist or early access. If we open a beta, waitlist members hear first.
        </p>
        {count > 0 && (
          <p className="page-muted mt-3 font-mono text-[12px]">
            {count.toLocaleString()} signed up
          </p>
        )}
      </Reveal>

      <Reveal delay={0.15}>
        <form onSubmit={submit} className="page-form-box mt-10 max-w-lg space-y-5 p-6 md:p-8">
          <div>
            <label className="page-eyebrow-sm">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="page-field mt-2 px-4 py-3 font-mono text-sm"
            />
          </div>
          <div>
            <label className="page-eyebrow-sm">
              Sui wallet{" "}
              <span className="normal-case tracking-normal opacity-70">(optional)</span>
            </label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x…"
              className="page-field mt-2 px-4 py-3 font-mono text-sm"
            />
          </div>
          <div>
            <label className="page-eyebrow-sm">Background</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["new", "New"],
                  ["trader", "Trader"],
                  ["power", "Power user"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setExperience(id)}
                  data-active={experience === id || undefined}
                  className="page-chip px-4 py-2 font-mono text-[11px] uppercase tracking-wider"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={status === "loading" || status === "done"}
            className="site-cta-btn--solid w-full py-4 font-mono text-[12px] font-bold uppercase tracking-wider transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {status === "loading" ? "Joining…" : status === "done" ? "Joined ✓" : "Join waitlist"}
          </button>
          {message && (
            <p
              className={`font-mono text-[12px] ${status === "error" ? "text-red-500" : "text-emerald-600"}`}
            >
              {message}
            </p>
          )}
        </form>
      </Reveal>

      <Reveal delay={0.2}>
        <p className="page-muted mt-8 max-w-lg text-[14px]">
          Judges and reviewers test the full app via DeepSurge submission notes — not through this
          waitlist.
        </p>
        <Link
          to="/studio"
          className="page-muted mt-4 inline-block font-mono text-[11px] uppercase tracking-wider underline-offset-2 hover:text-[color:var(--site-fg)] hover:underline"
        >
          How Veil works →
        </Link>
        {reviewerAppUrl() ? (
          <p className="page-muted mt-6 max-w-lg text-[13px]">
            DeepSurge reviewers: use the{" "}
            <a
              href={reviewerAppUrl()}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-[color:var(--site-fg)]"
            >
              reviewer app link
            </a>{" "}
            from our submission — not this waitlist page.
          </p>
        ) : null}
      </Reveal>
    </PageShell>
  );
}
