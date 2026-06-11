import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  ShieldCheck,
  CircleDot,
  Sparkles,
  X,
  Info,
  HelpCircle,
  ArrowUpRight,
} from "lucide-react";
import {
  DSCard,
  DSSectionTitle,
  DSSkeleton,
} from "@/components/DashboardShell";
import { useAuth, shortAddress } from "@/lib/auth/AuthProvider";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardOverview,
});

const STATS = [
  { label: "VOLUME · 24H", value: "$48,210", sub: "+12.4% vs yesterday" },
  { label: "OPEN POSITIONS", value: "3", sub: "BTC · ETH · SOL" },
  { label: "SLIPPAGE SAVED", value: "$1,842", sub: "vs naive market" },
  { label: "PROOFS POSTED", value: "27", sub: "100% verified" },
];

const ORDERS = [
  { id: "VL-0142", intent: "BTC up · 7d · $50k", mode: "BULL", state: "EXECUTING", progress: 64, slices: "7 / 11", pnl: "+1.24%" },
  { id: "VL-0141", intent: "ETH flat · 14d · $20k range-sell", mode: "BEAR", state: "SETTLED", progress: 100, slices: "9 / 9", pnl: "+0.82%" },
  { id: "VL-0140", intent: "Auto-compound PLP · USDC vault", mode: "EARN", state: "ACCRUING", progress: 42, slices: "epoch 18", pnl: "+4.1% APR" },
];

const PROOF_LOG = [
  { t: "16:44:41", tag: "ATTEST", text: "PCR0 0x8c2f…a91d verified · enclave veil-bull-v1.3" },
  { t: "16:44:38", tag: "SETTLE", text: "VL-0142 slice 7/11 filled @ $67,184 — Δslip −0.04%" },
  { t: "16:42:12", tag: "ROUTE",  text: "Cetus pool 0x9a…11 · depth $214k · spread 6bps" },
  { t: "16:41:50", tag: "ATTEST", text: "PCR0 0x71a0…44ce verified · enclave veil-router-v0.9" },
  { t: "16:39:02", tag: "ORDER",  text: "Intent VL-0143 admitted · BTC up 7d · k=11" },
  { t: "16:32:18", tag: "ATTEST", text: "PCR0 0x55b1…0fa2 verified" },
  { t: "16:28:00", tag: "SETTLE", text: "VL-0141 closed · realized +0.82%" },
  { t: "16:14:44", tag: "WALRUS", text: "Daily report sealed → walrus.site/veil/2026-06-11" },
];

const TAG: Record<string, string> = {
  ATTEST: "text-emerald-400",
  SETTLE: "text-[color:var(--ds-fg)]",
  ROUTE: "text-sky-400",
  ORDER: "text-amber-400",
  WALRUS: "text-fuchsia-400",
};

const ONBOARD_KEY = "veil.dashboard.onboarded";

function DashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [onboard, setOnboard] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    setOnboard(window.localStorage.getItem(ONBOARD_KEY) !== "1");
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    window.localStorage.setItem(ONBOARD_KEY, "1");
    setOnboard(false);
  }

  return (
    <div className="space-y-6">
      {/* HERO ROW: brand card + portfolio value */}
      <div className="grid gap-6 lg:grid-cols-12">
        <DSCard className="lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-[1.05] tracking-tight">
                Veil
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--ds-muted)]">
                Private execution for DeFi traders. Describe an intent — the
                enclave slices it into stealth orders, proves every fill on-chain,
                and seals the daily report to Walrus.
              </p>
            </div>
            <div className="flex -space-x-1">
              {["S", "$", "©", "T"].map((c, i) => (
                <span
                  key={i}
                  className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] text-[12px]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((s) =>
              loading ? (
                <div key={s.label} className="space-y-2">
                  <DSSkeleton className="h-3 w-20" />
                  <DSSkeleton className="h-7 w-16" />
                  <DSSkeleton className="h-3 w-24" />
                </div>
              ) : (
                <div key={s.label} className="min-w-0">
                  <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                    {s.label}
                    <Info className="h-3 w-3 opacity-50" />
                  </div>
                  <div className="mt-2 font-display text-3xl">{s.value}</div>
                  <div className="mt-1 font-mono text-[11px] text-[color:var(--ds-muted)]">
                    {s.sub}
                  </div>
                </div>
              ),
            )}
          </div>
        </DSCard>

        <DSCard className="flex flex-col justify-between lg:col-span-5">
          <div className="flex items-start justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
              Portfolio Value
            </div>
            <span className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[color:var(--ds-muted)]">
              Live Equity
            </span>
          </div>
          {loading ? (
            <DSSkeleton className="mt-6 h-10 w-44" />
          ) : (
            <div className="mt-4">
              <div className="font-display text-[clamp(2.5rem,4.5vw,4rem)] leading-none">
                $10,000.00
              </div>
              <div className="mt-2 font-mono text-[12px]">
                <span className="text-emerald-400">+$0.00 (+0.0%)</span>{" "}
                <span className="text-[color:var(--ds-muted)]">Unrealized Profits</span>
              </div>
            </div>
          )}
          <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-[color:var(--ds-pill)]">
            <div className="h-full w-full bg-gradient-to-r from-amber-500/30 via-amber-400 to-amber-300" />
          </div>
        </DSCard>
      </div>

      {/* ONBOARDING */}
      {onboard && (
        <DSCard className="relative">
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute right-4 top-4 text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
              New here · 60-second tour
            </span>
          </div>
          <h2 className="mt-3 font-display text-2xl">Three things power your cockpit.</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { icon: Activity, title: "Stealth Orders", body: "Describe an intent (\"buy $50k BTC over 7 days\"). The enclave slices it into private trades the market can't front-run." },
              { icon: ShieldCheck, title: "On-Chain Proofs", body: "Every slice is signed by a TEE. The PCR0 hash is posted to Sui so anyone can verify Veil ran the exact code it claims." },
              { icon: Sparkles, title: "Walrus Archive", body: "Daily, all orders + proofs + fills are sealed and stored on Walrus — a public, immutable receipt." },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-4">
                <c.icon className="h-4 w-4 text-[color:var(--ds-fg)]" />
                <div className="mt-3 font-display text-lg">{c.title}</div>
                <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--ds-muted)]">{c.body}</p>
              </div>
            ))}
          </div>
        </DSCard>
      )}

      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-12">
        <DSCard className="lg:col-span-7">
          <DSSectionTitle
            icon={Activity}
            title="Active Orders"
            action={
              <Link
                to="/dashboard/agents"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
              >
                View all →
              </Link>
            }
          />
          {loading ? (
            <ul className="mt-6 space-y-5">
              {[0, 1, 2].map((i) => (
                <li key={i} className="space-y-3 border-t border-[color:var(--ds-border)] pt-5">
                  <DSSkeleton className="h-3 w-32" />
                  <DSSkeleton className="h-4 w-3/4" />
                  <DSSkeleton className="h-1 w-full" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-6 space-y-5">
              {ORDERS.map((o) => (
                <li key={o.id} className="border-t border-[color:var(--ds-border)] pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[color:var(--ds-muted)]">
                        <span>{o.id}</span>
                        <span className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-2 py-0.5 text-[color:var(--ds-fg)]">
                          {o.mode}
                        </span>
                        <span className="flex items-center gap-1">
                          <CircleDot
                            className={`h-3 w-3 ${
                              o.state === "EXECUTING"
                                ? "animate-pulse text-emerald-400"
                                : o.state === "SETTLED"
                                ? "text-[color:var(--ds-muted)]"
                                : "text-amber-400"
                            }`}
                          />
                          {o.state}
                        </span>
                      </div>
                      <p className="mt-2 text-[14px] text-[color:var(--ds-fg)]">{o.intent}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[11px] text-[color:var(--ds-muted)]">{o.slices}</div>
                      <div className="mt-1 font-mono text-[12px] text-emerald-400">{o.pnl}</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[color:var(--ds-pill)]">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
                      style={{ width: `${o.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DSCard>

        <DSCard className="lg:col-span-5">
          <DSSectionTitle
            title="Proof Console"
            action={
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                ● live · 3s
              </span>
            }
          />
          {loading ? (
            <div className="mt-5 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <DSSkeleton key={i} className="h-3" />
              ))}
            </div>
          ) : (
            <ul className="mt-5 max-h-[360px] space-y-1.5 overflow-auto font-mono text-[11px] leading-relaxed">
              {PROOF_LOG.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[color:var(--ds-muted)]">{p.t}</span>
                  <span className={`shrink-0 ${TAG[p.tag]}`}>[{p.tag}]</span>
                  <span className="text-[color:var(--ds-fg)]">{p.text}</span>
                </li>
              ))}
            </ul>
          )}
        </DSCard>
      </div>

      {/* HELP STRIP */}
      <DSCard className="!py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-[color:var(--ds-muted)]">
          <span className="flex items-center gap-2">
            <HelpCircle className="h-3.5 w-3.5" /> Mock data, live-ready. Wallet{" "}
            {user && shortAddress(user.address)}.
          </span>
          <Link
            to="/dashboard/portfolio"
            className="inline-flex items-center gap-1 uppercase tracking-[0.2em] hover:text-[color:var(--ds-fg)]"
          >
            Open portfolio <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </DSCard>
    </div>
  );
}
