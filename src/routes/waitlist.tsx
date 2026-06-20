import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/SiteHeader";
import { Reveal, SegmentedCTA } from "@/components/Hero";
import { joinWaitlist, fetchWaitlistCount } from "@/lib/veil/waitlist";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Waitlist — Veil" },
      {
        name: "description",
        content:
          "Join the Veil waitlist for early DeepBook Predict testnet access. Stealth execution for every trader level.",
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

const LEVELS: { id: Experience; label: string; desc: string }[] = [
  { id: "new", label: "New to DeFi", desc: "Google zkLogin, gasless, guided intents" },
  { id: "trader", label: "Active trader", desc: "Wallet connect, 4 modes, live PnL" },
  { id: "power", label: "Power user", desc: "Pro cockpit, proofs, keeper settlement" },
];

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
      setMessage("You're on the list. We'll DM early access when testnet opens for the community.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <PageShell>
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet-300">
          Waitlist · DeepSurge DeepBook track
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.02] tracking-tight">
          Early access
          <br />
          <em className="italic text-white/64">before the crowd.</em>
        </h1>
      </Reveal>

      <div className="mt-12 grid gap-16 md:grid-cols-12">
        <Reveal delay={0.1} className="md:col-span-7">
          <p className="text-lg leading-relaxed text-white/72">
            Veil runs live on Predict testnet today. The waitlist is for the{" "}
            <strong className="text-white">community launch wave</strong> — when we&apos;re
            shortlisted on DeepSurge, waitlist members get first access to stealth orders, Enoki
            sponsored txs, and the full cockpit (Lite for beginners, Pro for traders).
          </p>
          {count > 0 && (
            <p className="mt-4 font-mono text-[12px] text-white/50">
              {count.toLocaleString()} on the waitlist
            </p>
          )}

          <form onSubmit={submit} className="mt-10 space-y-6 border border-white/10 bg-white/5 p-6 md:p-8">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="mt-2 w-full border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none focus:border-violet-400/50"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Sui wallet (optional)
              </label>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="0x…"
                className="mt-2 w-full border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none focus:border-violet-400/50"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                I am a…
              </label>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setExperience(l.id)}
                    className={`border px-3 py-3 text-left transition-colors ${
                      experience === l.id
                        ? "border-violet-400/60 bg-violet-500/10"
                        : "border-white/10 bg-black/20 hover:border-white/20"
                    }`}
                  >
                    <div className="font-mono text-[11px] uppercase text-white">{l.label}</div>
                    <div className="mt-1 text-[11px] leading-snug text-white/50">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={status === "loading" || status === "done"}
              className="w-full bg-white py-4 font-mono text-[12px] font-bold uppercase tracking-wider text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {status === "loading" ? "Joining…" : status === "done" ? "Joined ✓" : "Join waitlist"}
            </button>
            {message && (
              <p
                className={`font-mono text-[12px] ${status === "error" ? "text-red-400" : "text-emerald-400"}`}
              >
                {message}
              </p>
            )}
          </form>
        </Reveal>

        <Reveal delay={0.2} className="md:col-span-5">
          <div className="space-y-6 border-l border-white/10 pl-6">
            <div>
              <h3 className="font-display text-xl text-white">What you get</h3>
              <ul className="mt-3 space-y-2 text-[14px] text-white/70">
                <li>· Stealth BULL/BEAR/EARN/PARLAY on DeepBook Predict</li>
                <li>· TEE attestation + on-chain ExecutionProof</li>
                <li>· Realized PnL when keeper settles</li>
                <li>· Google zkLogin or any Sui wallet</li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl text-white">Timeline</h3>
              <ol className="mt-3 space-y-3 font-mono text-[12px] text-white/60">
                <li>
                  <span className="text-white">Now</span> — waitlist + teasers on X
                </li>
                <li>
                  <span className="text-white">Shortlist</span> — community testnet access
                </li>
                <li>
                  <span className="text-white">June 21</span> — DeepSurge submission deadline
                </li>
              </ol>
            </div>
            <SegmentedCTA label="TRY TESTNET NOW" to="/auth" variant="solid" />
            <Link to="/studio" className="block text-[13px] text-white/50 underline-offset-2 hover:text-white hover:underline">
              Read how stealth execution works →
            </Link>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
