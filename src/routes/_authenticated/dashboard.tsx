import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteHeader";
import { Reveal, SegmentedCTA } from "@/components/Hero";
import { useAuth, shortAddress } from "@/lib/auth/AuthProvider";
import {
  Activity,
  ShieldCheck,
  Archive,
  TrendingUp,
  CircleDot,
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

/* -------------------- MOCK DATA (swap with live RPC + indexer) -------------------- */

const STATS = [
  { label: "VOLUME (24H)", value: "$48,210", delta: "+12.4%" },
  { label: "OPEN POSITIONS", value: "3", delta: "BTC · ETH · SOL" },
  { label: "SLIPPAGE SAVED", value: "$1,842", delta: "vs naive" },
  { label: "PROOFS POSTED", value: "27", delta: "100% verified" },
];

const ORDERS = [
  {
    id: "VL-0142",
    intent: "BTC up · 7d · $50k · 65% conviction",
    mode: "BULL",
    state: "EXECUTING",
    progress: 64,
    slices: "7 / 11",
  },
  {
    id: "VL-0141",
    intent: "ETH flat · 14d · $20k · range-sell",
    mode: "BEAR",
    state: "SETTLED",
    progress: 100,
    slices: "9 / 9",
  },
  {
    id: "VL-0140",
    intent: "Auto-compound PLP · USDC vault",
    mode: "EARN",
    state: "ACCRUING",
    progress: 42,
    slices: "epoch 18",
  },
];

const PROOFS = [
  { hash: "0x8c2f…a91d", enclave: "PCR0 ✓", at: "2 min ago" },
  { hash: "0x71a0…44ce", enclave: "PCR0 ✓", at: "1 h ago" },
  { hash: "0x55b1…0fa2", enclave: "PCR0 ✓", at: "3 h ago" },
  { hash: "0xd902…7711", enclave: "PCR0 ✓", at: "yesterday" },
];

/* -------------------- COMPONENT -------------------- */

function DashboardPage() {
  const { user } = useAuth();

  return (
    <PageShell>
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
              Cockpit · Mock data · Live-ready
            </p>
            <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,4rem)] font-medium leading-[1.05] tracking-tight">
              Welcome back,{" "}
              <em className="italic text-white/64">
                {user?.method === "wallet"
                  ? "trader"
                  : user?.label.split("@")[0] ?? "trader"}
              </em>
              .
            </h1>
            <p className="mt-3 font-mono text-[11px] text-white/40">
              {shortAddress(user!.address)} ·{" "}
              {user!.method.toUpperCase()} session
            </p>
          </div>
          <SegmentedCTA label="NEW STEALTH ORDER" variant="solid" />
        </div>
      </Reveal>

      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.05}>
            <div className="bg-white/[0.03] p-6 backdrop-blur-[60px]">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                {s.label}
              </div>
              <div className="mt-3 font-display text-3xl">{s.value}</div>
              <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-white/50">
                <TrendingUp className="h-3 w-3" />
                {s.delta}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-12">
        {/* ORDERS */}
        <Reveal delay={0.1} className="lg:col-span-8">
          <div className="bg-white/[0.03] p-6 backdrop-blur-[60px] md:p-8">
            <header className="flex items-center justify-between">
              <h2 className="flex items-center gap-3 font-display text-2xl">
                <Activity className="h-5 w-5 text-white/60" />
                Active Orders
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Updated 3s ago
              </span>
            </header>
            <ul className="mt-8 space-y-6">
              {ORDERS.map((o) => (
                <li key={o.id} className="border-t border-white/10 pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3 font-mono text-[11px] text-white/50">
                        <span>{o.id}</span>
                        <span className="bg-white/10 px-2 py-0.5 text-white/80">
                          {o.mode}
                        </span>
                        <span className="flex items-center gap-1 text-white/60">
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
                      <p className="mt-3 text-[15px] text-white/85">
                        {o.intent}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-white/40">
                      {o.slices}
                    </span>
                  </div>
                  <div className="mt-4 h-[3px] w-full bg-white/10">
                    <div
                      className="h-full bg-white transition-all"
                      style={{ width: `${o.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* PROOFS */}
        <Reveal delay={0.2} className="lg:col-span-4">
          <div className="bg-white/[0.03] p-6 backdrop-blur-[60px] md:p-8">
            <h2 className="flex items-center gap-3 font-display text-2xl">
              <ShieldCheck className="h-5 w-5 text-white/60" />
              On-Chain Proofs
            </h2>
            <ul className="mt-6 space-y-4 font-mono text-[12px]">
              {PROOFS.map((p) => (
                <li
                  key={p.hash}
                  className="flex items-center justify-between border-t border-white/10 pt-4"
                >
                  <span className="text-white/80">{p.hash}</span>
                  <span className="text-emerald-300/80">{p.enclave}</span>
                  <span className="text-white/40">{p.at}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      {/* WALRUS ARCHIVE */}
      <Reveal delay={0.15} className="mt-10 block">
        <div className="bg-white/[0.03] p-8 backdrop-blur-[60px]">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Archive className="h-5 w-5 text-white/60" />
              <div>
                <h2 className="font-display text-2xl">Walrus Archive</h2>
                <p className="mt-1 font-mono text-[11px] text-white/40">
                  walrus.site/veil-report/{shortAddress(user!.address, 4, 4)}
                </p>
              </div>
            </div>
            <SegmentedCTA label="OPEN REPORT" />
          </div>
        </div>
      </Reveal>

      <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
        Dashboard rendering mock data — swap providers in
        src/routes/_authenticated/dashboard.tsx for live RPC / indexer feeds.
      </p>
    </PageShell>
  );
}
