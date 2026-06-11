import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/SiteHeader";
import { Reveal, SegmentedCTA } from "@/components/Hero";
import { useAuth, shortAddress } from "@/lib/auth/AuthProvider";
import {
  Activity,
  ShieldCheck,
  Archive,
  TrendingUp,
  CircleDot,
  Info,
  X,
  Copy,
  ExternalLink,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Veil" },
      {
        name: "description",
        content:
          "Stealth orders, on-chain proofs, and Walrus archives — all in one cockpit.",
      },
    ],
  }),
  component: DashboardPage,
});

/* -------------------- MOCK DATA -------------------- */

const STATS = [
  { label: "VOLUME · 24H", value: "$48,210", sub: "+12.4% vs yesterday", hint: "Total notional routed through stealth orders in the last 24 hours." },
  { label: "OPEN POSITIONS", value: "3", sub: "BTC · ETH · SOL", hint: "Stealth orders currently slicing into the market." },
  { label: "SLIPPAGE SAVED", value: "$1,842", sub: "vs naive market order", hint: "Estimated price improvement vs sending the same size as a single market order." },
  { label: "PROOFS POSTED", value: "27", sub: "100% verified on-chain", hint: "Enclave attestations published to Sui in the last 24 hours." },
];

const ORDERS = [
  { id: "VL-0142", intent: "BTC up · 7d · $50k · 65% conviction", mode: "BULL", state: "EXECUTING", progress: 64, slices: "7 / 11", pnl: "+1.24%" },
  { id: "VL-0141", intent: "ETH flat · 14d · $20k · range-sell", mode: "BEAR", state: "SETTLED", progress: 100, slices: "9 / 9", pnl: "+0.82%" },
  { id: "VL-0140", intent: "Auto-compound PLP · USDC vault", mode: "EARN", state: "ACCRUING", progress: 42, slices: "epoch 18", pnl: "+4.1% APR" },
];

const PROOF_LOG = [
  { t: "16:44:41", tag: "ATTEST", text: "PCR0 0x8c2f…a91d verified · enclave veil-bull-v1.3" },
  { t: "16:44:38", tag: "SETTLE", text: "VL-0142 slice 7/11 filled @ $67,184 — Δslip −0.04%" },
  { t: "16:42:12", tag: "ROUTE",  text: "Cetus pool 0x9a…11 selected · depth $214k · spread 6bps" },
  { t: "16:41:50", tag: "ATTEST", text: "PCR0 0x71a0…44ce verified · enclave veil-router-v0.9" },
  { t: "16:39:02", tag: "ORDER",  text: "Intent VL-0143 admitted · BTC up 7d · k=11 slices" },
  { t: "16:32:18", tag: "ATTEST", text: "PCR0 0x55b1…0fa2 verified · enclave veil-bull-v1.3" },
  { t: "16:28:00", tag: "SETTLE", text: "VL-0141 closed · realized +0.82% · gas 0.0021 SUI" },
  { t: "16:14:44", tag: "WALRUS", text: "Daily report sealed → walrus.site/veil/2026-06-11" },
];

const TAG_COLOR: Record<string, string> = {
  ATTEST: "text-emerald-300/80",
  SETTLE: "text-white/70",
  ROUTE:  "text-sky-300/80",
  ORDER:  "text-amber-300/80",
  WALRUS: "text-fuchsia-300/80",
};

const ARCHIVE = [
  { date: "2026-06-11", hash: "0x9d4c…77a1", size: "1.4 MB", proofs: 27 },
  { date: "2026-06-10", hash: "0x71f0…b220", size: "1.9 MB", proofs: 31 },
  { date: "2026-06-09", hash: "0x402a…ee18", size: "0.8 MB", proofs: 14 },
];

/* -------------------- COMPONENT -------------------- */

const ONBOARD_KEY = "veil.dashboard.onboarded";

function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showOnboard, setShowOnboard] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 850);
    setShowOnboard(
      typeof window !== "undefined" &&
        window.localStorage.getItem(ONBOARD_KEY) !== "1",
    );
    return () => clearTimeout(t);
  }, []);

  function dismissOnboard() {
    window.localStorage.setItem(ONBOARD_KEY, "1");
    setShowOnboard(false);
  }

  function copyAddr() {
    if (user) navigator.clipboard?.writeText(user.address);
  }

  return (
    <PageShell>
      {/* HEADER */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Engine · Live
              </span>
              <span className="text-white/20">·</span>
              <span>Mock data · live-ready</span>
            </div>
            <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,4rem)] font-medium leading-[1.05] tracking-tight">
              Welcome back,{" "}
              <em className="italic text-white/64">
                {user?.method === "wallet"
                  ? "trader"
                  : user?.label.split("@")[0] ?? "trader"}
              </em>
              .
            </h1>
            <button
              onClick={copyAddr}
              className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] text-white/40 transition-colors hover:text-white/80"
              title="Copy address"
            >
              {shortAddress(user!.address)} · {user!.method.toUpperCase()}
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <SegmentedCTA label="NEW STEALTH ORDER" variant="solid" />
        </div>
      </Reveal>

      {/* ONBOARDING PANEL */}
      {showOnboard && (
        <Reveal delay={0.05} className="mt-10 block">
          <div className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-[60px] md:p-8">
            <button
              onClick={dismissOnboard}
              className="absolute right-4 top-4 text-white/40 transition-colors hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
                New here? · 60-second tour
              </span>
            </div>
            <h2 className="mt-4 font-display text-2xl leading-tight md:text-3xl">
              Three things power your cockpit.
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Activity,
                  title: "Stealth Orders",
                  body: "You describe an intent (\"buy $50k BTC over 7 days\"). Veil's enclave slices it into private trades the market can't front-run.",
                },
                {
                  icon: ShieldCheck,
                  title: "On-Chain Proofs",
                  body: "Every slice is signed by a TEE (trusted enclave). The proof (PCR0 hash) is posted to Sui so anyone can verify Veil ran the exact code it claims.",
                },
                {
                  icon: Archive,
                  title: "Walrus Archive",
                  body: "Daily, all your orders + proofs + fills are sealed and stored on Walrus — a public, immutable receipt of every decision the engine made.",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className="border-l border-white/10 pl-5"
                >
                  <c.icon className="h-4 w-4 text-white/60" />
                  <div className="mt-3 font-display text-lg">{c.title}</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/60">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-5">
              <button
                onClick={dismissOnboard}
                className="bg-white px-5 py-2.5 font-mono text-[11px] font-bold tracking-[0.15em] text-black transition-colors hover:bg-white/90"
              >
                GOT IT
              </button>
              <a
                href="/roadmap"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white"
              >
                Read the roadmap →
              </a>
            </div>
          </div>
        </Reveal>
      )}

      {/* STAT PILLS */}
      <div className="mt-10 flex flex-wrap gap-3">
        {STATS.map((s, i) =>
          loading ? (
            <div
              key={s.label}
              className="h-[92px] w-[220px] animate-pulse border border-white/10 bg-white/[0.02]"
            />
          ) : (
            <Reveal key={s.label} delay={i * 0.04}>
              <div className="group min-w-[220px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-[60px] transition-colors hover:border-white/20">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {s.label}
                  <Info className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                </div>
                <div className="mt-2 font-display text-3xl">{s.value}</div>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-white/50">
                  <TrendingUp className="h-3 w-3" />
                  {s.sub}
                </div>
              </div>
            </Reveal>
          ),
        )}
      </div>

      {/* MAIN GRID: ORDERS + PROOF CONSOLE */}
      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        {/* ACTIVE ORDERS */}
        <Reveal delay={0.1} className="lg:col-span-7">
          <div className="border border-white/10 bg-white/[0.03] p-6 backdrop-blur-[60px] md:p-7">
            <header className="flex items-center justify-between">
              <h2 className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
                <Activity className="h-3.5 w-3.5" />
                Active Orders
              </h2>
              <a
                href="#"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
              >
                View all →
              </a>
            </header>
            {loading ? (
              <ul className="mt-6 space-y-5">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="space-y-3 border-t border-white/10 pt-5">
                    <div className="h-3 w-32 animate-pulse bg-white/10" />
                    <div className="h-4 w-3/4 animate-pulse bg-white/10" />
                    <div className="h-[3px] w-full animate-pulse bg-white/10" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-6 space-y-5">
                {ORDERS.map((o) => (
                  <li key={o.id} className="border-t border-white/10 pt-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-white/50">
                          <span>{o.id}</span>
                          <span className="border border-white/15 bg-white/5 px-2 py-0.5 text-white/80">
                            {o.mode}
                          </span>
                          <span className="flex items-center gap-1">
                            <CircleDot
                              className={`h-3 w-3 ${
                                o.state === "EXECUTING"
                                  ? "animate-pulse text-emerald-400"
                                  : o.state === "SETTLED"
                                  ? "text-white/40"
                                  : "text-amber-300"
                              }`}
                            />
                            {o.state}
                          </span>
                        </div>
                        <p className="mt-2.5 text-[14px] text-white/85">
                          {o.intent}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[11px] text-white/40">
                          {o.slices}
                        </div>
                        <div className="mt-1 font-mono text-[12px] text-emerald-300/80">
                          {o.pnl}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 h-[2px] w-full bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-white/60 to-white transition-all"
                        style={{ width: `${o.progress}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>

        {/* PROOF CONSOLE */}
        <Reveal delay={0.15} className="lg:col-span-5">
          <div className="border border-white/10 bg-black/60 p-5 backdrop-blur-[60px] md:p-6">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
                <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Proof Console
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                live · 3s
              </span>
            </header>
            {loading ? (
              <div className="mt-5 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-3 animate-pulse bg-white/5"
                    style={{ width: `${60 + ((i * 7) % 35)}%` }}
                  />
                ))}
              </div>
            ) : (
              <ul className="mt-5 max-h-[360px] space-y-1.5 overflow-auto font-mono text-[11px] leading-relaxed">
                {PROOF_LOG.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-white/30">{p.t}</span>
                    <span className={`shrink-0 ${TAG_COLOR[p.tag] ?? "text-white/60"}`}>
                      [{p.tag}]
                    </span>
                    <span className="text-white/70">{p.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      </div>

      {/* WALRUS ARCHIVE */}
      <Reveal delay={0.15} className="mt-6 block">
        <div className="border border-white/10 bg-white/[0.03] p-6 backdrop-blur-[60px] md:p-7">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Archive className="h-4 w-4 text-white/60" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
                Walrus Archive
              </h2>
              <span className="hidden font-mono text-[10px] text-white/30 md:inline">
                walrus.site/veil/{shortAddress(user!.address, 4, 4)}
              </span>
            </div>
            <SegmentedCTA label="OPEN LATEST" />
          </header>
          {loading ? (
            <div className="mt-6 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse bg-white/5" />
              ))}
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-white/10">
              {ARCHIVE.map((a) => (
                <li
                  key={a.hash}
                  className="grid grid-cols-12 items-center gap-3 py-3 font-mono text-[12px] text-white/70"
                >
                  <span className="col-span-3 text-white/85">{a.date}</span>
                  <span className="col-span-4 text-white/60">{a.hash}</span>
                  <span className="col-span-2 text-white/50">{a.size}</span>
                  <span className="col-span-2 text-emerald-300/80">
                    {a.proofs} proofs
                  </span>
                  <a
                    href="#"
                    className="col-span-1 flex justify-end text-white/40 hover:text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      {/* HELP STRIP */}
      <Reveal delay={0.2} className="mt-6 block">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-white/[0.02] px-5 py-4 font-mono text-[11px] text-white/50">
          <span className="flex items-center gap-2">
            <HelpCircle className="h-3.5 w-3.5" />
            Stuck? Every widget is wired to mock providers — swap them in{" "}
            <code className="text-white/70">src/routes/_authenticated/dashboard.tsx</code>{" "}
            for live RPC.
          </span>
          <a href="/journal" className="uppercase tracking-[0.2em] hover:text-white">
            Read build log →
          </a>
        </div>
      </Reveal>
    </PageShell>
  );
}
