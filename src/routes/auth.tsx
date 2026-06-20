import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { PageShell } from "@/components/SiteHeader";
import { Reveal } from "@/components/Hero";
import { useAuth, isZkLoginConfigured, type AuthMethod } from "@/lib/auth/AuthProvider";
import {
  canAccessDashboard,
  isWaitlistOnlyMode,
  tryUnlockJudge,
} from "@/lib/access";
import { Wallet, ChevronRight } from "lucide-react";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
  judge: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Begin Journey — Veil" },
      {
        name: "description",
        content: "Sign in to Veil — Sui Wallet or Google zkLogin via Enoki on Sui testnet.",
      },
      { property: "og:title", content: "Begin Journey — Veil" },
      {
        property: "og:description",
        content: "Sign in via Sui Wallet or Enoki Google zkLogin.",
      },
    ],
  }),
  component: AuthPage,
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v3.2h5.35c-.23 1.5-1.7 4.4-5.35 4.4a6.2 6.2 0 1 1 0-12.4c1.93 0 3.23.82 3.97 1.52l2.7-2.6C16.97 3.6 14.7 2.6 12 2.6 6.74 2.6 2.5 6.84 2.5 12.1S6.74 21.6 12 21.6c6.93 0 9.5-4.85 9.5-7.3 0-.5-.05-.86-.15-1.2Z"
      />
    </svg>
  );
}

function AuthPage() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { redirect, judge } = Route.useSearch();
  const [tab, setTab] = useState<AuthMethod>("wallet");
  const [busy, setBusy] = useState<AuthMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [judgeCode, setJudgeCode] = useState("");
  const [judgeOk, setJudgeOk] = useState(canAccessDashboard());
  const waitlistOnly = isWaitlistOnlyMode();
  const zkLoginReady = isZkLoginConfigured();

  useEffect(() => {
    if (judge && tryUnlockJudge(judge)) setJudgeOk(true);
  }, [judge]);

  useEffect(() => {
    if (isAuthenticated && canAccessDashboard()) {
      navigate({ to: redirect ?? "/dashboard", replace: true });
    }
  }, [isAuthenticated, navigate, redirect]);

  async function handleSignIn(method: AuthMethod) {
    setError(null);
    if (!canAccessDashboard()) {
      setError("Judge access required. Use the access code from your submission packet.");
      return;
    }
    if (method === "google" && !zkLoginReady) {
      setError("Configure VITE_ENOKI_PUBLIC_KEY and VITE_GOOGLE_CLIENT_ID in .env");
      return;
    }
    setBusy(method);
    try {
      await signIn(method);
      navigate({ to: redirect ?? "/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            Begin Journey
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.25rem,5vw,4.5rem)] font-medium leading-[1.02] tracking-tight">
            One door.
            <br />
            <em className="italic text-white/64">Two keys.</em>
          </h1>
          <p className="mt-8 max-w-md text-[15px] leading-relaxed text-white/64">
            Connect a Sui wallet or sign in with Google via Enoki zkLogin. Veil never sees your
            private key. Sponsored transactions settle on Sui testnet without you holding SUI for
            gas.
          </p>
          <div className="mt-10 space-y-3 font-mono text-[11px] text-white/40">
            <div>· Enoki zkLogin + sponsored txs (testnet)</div>
            <div>· Mysten dapp-kit for native wallets</div>
            <div>· Nautilus TEE attestation on every execution</div>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="md:col-span-6">
          <div className="bg-white/[0.04] p-8 backdrop-blur-[60px]">
            <div className="flex gap-1 bg-black/40 p-1 font-mono text-[11px]">
              {(
                [
                  { k: "wallet" as const, label: "WALLET" },
                  { k: "google" as const, label: "GOOGLE" },
                ] as const
              ).map((t) => (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setTab(t.k)}
                  className={`flex-1 px-3 py-3 tracking-[0.15em] transition-colors ${
                    tab === t.k ? "bg-white text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-8 min-h-[220px]">
              {waitlistOnly && !judgeOk ? (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-white/70">
                    Public beta is waitlist-only until shortlist in July. Judges and reviewers: enter
                    your access code to sign in and test the full dashboard.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={judgeCode}
                      onChange={(e) => setJudgeCode(e.target.value)}
                      placeholder="Judge access code"
                      className="flex-1 border border-white/20 bg-black/40 px-3 py-3 font-mono text-[12px] text-white outline-none focus:border-white/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tryUnlockJudge(judgeCode)) {
                          setJudgeOk(true);
                          setError(null);
                        } else {
                          setError("Invalid judge access code");
                        }
                      }}
                      className="bg-white px-4 py-3 font-mono text-[11px] font-bold text-black"
                    >
                      UNLOCK
                    </button>
                  </div>
                </div>
              ) : (
                <>
              {tab === "wallet" && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-white/70">
                    Connect any Sui-compatible wallet. Signing happens only when you submit an order
                    or approve a sponsored transaction.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSignIn("wallet")}
                    disabled={busy !== null}
                    className="group flex w-full items-center justify-between bg-white px-6 py-5 font-mono text-[12px] font-bold tracking-[-0.01em] text-black transition-colors hover:bg-gray-200 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-3">
                      <Wallet className="h-4 w-4" />
                      {busy === "wallet" ? "CONNECTING…" : "CONNECT SUI WALLET"}
                    </span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              )}

              {tab === "google" && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-white/70">
                    Google + Enoki zkLogin derives a real Sui address from your Google identity. Gas
                    is sponsored by Veil via Enoki on testnet.
                  </p>
                  {!zkLoginReady && (
                    <p className="font-mono text-[11px] text-amber-400/90">
                      Add Enoki public key + Google OAuth client ID to enable zkLogin.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSignIn("google")}
                    disabled={busy !== null || !zkLoginReady}
                    className="group flex w-full items-center justify-between bg-white px-6 py-5 font-mono text-[12px] font-bold tracking-[-0.01em] text-black transition-colors hover:bg-gray-200 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-3">
                      <GoogleMark />
                      {busy === "google" ? "OPENING GOOGLE…" : "CONTINUE WITH GOOGLE"}
                    </span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              )}
                </>
              )}

              {error && <p className="mt-4 font-mono text-[11px] text-red-400">{error}</p>}
            </div>

            <p className="mt-8 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
              Sui testnet · DeepBook Predict · Enoki
            </p>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
