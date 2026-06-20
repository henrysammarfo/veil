import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { PageShell } from "@/components/SiteHeader";
import { Reveal } from "@/components/Hero";
import { useAuth, isZkLoginConfigured, type AuthMethod } from "@/lib/auth/AuthProvider";
import { canAccessDashboard, isWaitlistOnlyMode, reviewerAppUrl } from "@/lib/access";
import { Wallet, ChevronRight, ExternalLink } from "lucide-react";

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

function WaitlistOnlyAuthNotice() {
  const reviewer = reviewerAppUrl();

  return (
    <PageShell>
      <Reveal>
        <p className="page-eyebrow">Public site</p>
        <h1 className="mt-6 font-display text-[clamp(2rem,4vw,3.5rem)] font-medium leading-tight">
          Waitlist only here.
        </h1>
        <p className="page-body mt-6 max-w-lg text-[16px]">
          This deploy is for the community waitlist. There is no dashboard on this URL and no access
          code to enter.
        </p>
        {reviewer ? (
          <div className="page-form-box mt-8 max-w-lg p-6">
            <p className="page-eyebrow-sm">DeepSurge reviewers</p>
            <p className="page-body mt-3 text-[15px]">
              Open the <strong>reviewer app link</strong> from our submission — sign in with wallet
              or Google. No code required.
            </p>
            <a
              href={reviewer}
              target="_blank"
              rel="noreferrer"
              className="site-cta-btn--solid mt-6 inline-flex items-center gap-2 px-6 py-4 font-mono text-[12px] font-bold uppercase tracking-wider"
            >
              Open reviewer app
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <p className="page-muted mt-6 max-w-lg text-[14px]">
            DeepSurge reviewers: use the separate reviewer app URL listed in our submission notes.
          </p>
        )}
        <Link
          to="/waitlist"
          className="page-muted mt-8 inline-block font-mono text-[11px] uppercase tracking-wider underline-offset-2 hover:text-[color:var(--site-fg)] hover:underline"
        >
          ← Join the waitlist
        </Link>
      </Reveal>
    </PageShell>
  );
}

function AuthPage() {
  if (isWaitlistOnlyMode()) {
    return <WaitlistOnlyAuthNotice />;
  }
  return <ReviewerAuthForm />;
}

function ReviewerAuthForm() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [tab, setTab] = useState<AuthMethod>("wallet");
  const [busy, setBusy] = useState<AuthMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const zkLoginReady = isZkLoginConfigured();

  useEffect(() => {
    if (isAuthenticated && canAccessDashboard()) {
      navigate({ to: redirect ?? "/dashboard", replace: true });
    }
  }, [isAuthenticated, navigate, redirect]);

  async function handleSignIn(method: AuthMethod) {
    setError(null);
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
          <p className="page-eyebrow">Begin Journey</p>
          <h1 className="mt-6 font-display text-[clamp(2.25rem,5vw,4.5rem)] font-medium leading-[1.02] tracking-tight">
            One door.
            <br />
            <em className="page-em">Two keys.</em>
          </h1>
          <p className="page-body mt-8 max-w-md text-[15px]">
            Connect a Sui wallet or sign in with Google via Enoki zkLogin. Veil never sees your
            private key. Sponsored transactions settle on Sui testnet without you holding SUI for
            gas.
          </p>
          <div className="page-muted mt-10 space-y-3 font-mono text-[11px]">
            <div>· Enoki zkLogin + sponsored txs (testnet)</div>
            <div>· Mysten dapp-kit for native wallets</div>
            <div>· Nautilus TEE attestation on every execution</div>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="md:col-span-6">
          <div className="page-form-box p-8 backdrop-blur-[60px]">
            <div className="flex gap-1 bg-[var(--page-field-bg)] p-1 font-mono text-[11px]">
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
                    tab === t.k
                      ? "bg-[var(--site-cta-bg)] text-[var(--site-cta-fg)]"
                      : "page-muted hover:text-[color:var(--site-fg)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-8 min-h-[220px]">
              {tab === "wallet" && (
                <div className="space-y-4">
                  <p className="page-muted text-sm">
                    Connect any Sui-compatible wallet. Signing happens only when you submit an order
                    or approve a sponsored transaction.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSignIn("wallet")}
                    disabled={busy !== null}
                    className="site-cta-btn--solid group flex w-full items-center justify-between px-6 py-5 font-mono text-[12px] font-bold tracking-[-0.01em] transition-opacity hover:opacity-90 disabled:opacity-50"
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
                  <p className="page-muted text-sm">
                    Google + Enoki zkLogin derives a real Sui address from your Google identity. Gas
                    is sponsored by Veil via Enoki on testnet.
                  </p>
                  {!zkLoginReady && (
                    <p className="font-mono text-[11px] text-amber-600">
                      Add Enoki public key + Google OAuth client ID to enable zkLogin.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSignIn("google")}
                    disabled={busy !== null || !zkLoginReady}
                    className="site-cta-btn--solid group flex w-full items-center justify-between px-6 py-5 font-mono text-[12px] font-bold tracking-[-0.01em] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-3">
                      <GoogleMark />
                      {busy === "google" ? "OPENING GOOGLE…" : "CONTINUE WITH GOOGLE"}
                    </span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              )}

              {error && <p className="mt-4 font-mono text-[11px] text-red-500">{error}</p>}
            </div>

            <p className="page-eyebrow-sm page-divider mt-8 border-t pt-6">
              Sui testnet · DeepBook Predict · Enoki
            </p>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}