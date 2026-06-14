import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { PageShell } from "@/components/SiteHeader";
import { Reveal } from "@/components/Hero";
import { useAuth, type AuthMethod } from "@/lib/auth/AuthProvider";
import { Wallet, Mail, ChevronRight } from "lucide-react";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Begin Journey — Veil" },
      {
        name: "description",
        content:
          "Sign in to Veil — Sui Wallet, Google (zkLogin), or email. Noob to power user, all welcome.",
      },
      { property: "og:title", content: "Begin Journey — Veil" },
      {
        property: "og:description",
        content: "Sign in via Sui Wallet, Google zkLogin, or email.",
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
  useSearch({ from: "/auth" });
  const [tab, setTab] = useState<AuthMethod>("wallet");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState<AuthMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    navigate({ to: "/dashboard" });
  }

  async function handleSignIn(method: AuthMethod) {
    setError(null);
    // Email flow has two steps: send link/OTP, then verify code.
    if (method === "email" && !otpSent) {
      if (!email) { setError("Enter your email"); return; }
      setBusy("email");
      await new Promise((r) => setTimeout(r, 600));
      setOtpSent(true);
      setBusy(null);
      return;
    }
    if (method === "email" && otpSent && otp.length < 4) {
      setError("Enter the 6-digit code we sent (any 6 digits work in mock).");
      return;
    }
    setBusy(method);
    try {
      await signIn(method, method !== "wallet" ? { email } : undefined);
      navigate({ to: "/dashboard" });
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
            One door.<br />
            <em className="italic text-white/64">Three keys.</em>
          </h1>
          <p className="mt-8 max-w-md text-[15px] leading-relaxed text-white/64">
            Connect a Sui wallet, sign in with Google via zkLogin, or use plain
            email. Veil never sees your private key, and you never need SUI to
            pay gas — every transaction settles in gasless USDC.
          </p>
          <div className="mt-10 space-y-3 font-mono text-[11px] text-white/40">
            <div>· Powered by Enoki zkLogin (mock in dev, live on clone)</div>
            <div>· Mysten dapp-kit for native wallets</div>
            <div>· No password stored, ever</div>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="md:col-span-6">
          <div className="bg-white/[0.04] p-8 backdrop-blur-[60px]">
            <div className="flex gap-1 bg-black/40 p-1 font-mono text-[11px]">
              {(
                [
                  { k: "wallet", label: "WALLET" },
                  { k: "google", label: "GOOGLE" },
                  { k: "email", label: "EMAIL" },
                ] as const
              ).map((t) => (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setTab(t.k)}
                  className={`flex-1 px-3 py-3 tracking-[0.15em] transition-colors ${
                    tab === t.k
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-8 min-h-[220px]">
              {tab === "wallet" && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-white/70">
                    Connect any Sui-compatible wallet. We'll request a read-only
                    address — no signing until you place an order.
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
                    Google + zkLogin gives you a real Sui address derived from
                    your Google identity. Zero seed-phrase. Zero custody.
                  </p>
                  <input
                    type="email"
                    placeholder="you@gmail.com (mock)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b border-white/20 bg-transparent py-3 text-white outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSignIn("google")}
                    disabled={busy !== null}
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

              {tab === "email" && !otpSent && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-white/70">
                    Magic-link sign-in. We'll mint you a zkLogin-derived Sui
                    address tied to your email.
                  </p>
                  <input
                    type="email"
                    required
                    placeholder="you@veil.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b border-white/20 bg-transparent py-3 text-white outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSignIn("email")}
                    disabled={busy !== null || !email}
                    className="group flex w-full items-center justify-between bg-white px-6 py-5 font-mono text-[12px] font-bold tracking-[-0.01em] text-black transition-colors hover:bg-gray-200 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-3">
                      <Mail className="h-4 w-4" />
                      {busy === "email" ? "SENDING…" : "SEND MAGIC LINK"}
                    </span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              )}

              {tab === "email" && otpSent && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-white/70">
                    We sent a 6-digit code to <span className="text-white">{email}</span>.
                    Paste it below to mint your Sui address.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full border-b border-white/20 bg-transparent py-3 text-center font-mono text-2xl tracking-[0.5em] text-white outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSignIn("email")}
                    disabled={busy !== null || otp.length < 4}
                    className="group flex w-full items-center justify-between bg-white px-6 py-5 font-mono text-[12px] font-bold tracking-[-0.01em] text-black transition-colors hover:bg-gray-200 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-3">
                      <Mail className="h-4 w-4" />
                      {busy === "email" ? "VERIFYING…" : "VERIFY & ENTER"}
                    </span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); }}
                    className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/50 hover:text-white"
                  >
                    ← Use a different email
                  </button>
                </div>
              )}

              {error && (
                <p className="mt-4 font-mono text-[11px] text-red-400">{error}</p>
              )}
            </div>

            <p className="mt-8 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
              Mock mode · swap to Enoki on clone
            </p>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
