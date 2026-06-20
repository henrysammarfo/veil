import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, Check, LogOut, Wallet, Bell, Shield, Palette, Link2 } from "lucide-react";
import { DSCard, DSSectionTitle } from "@/components/DashboardShell";
import { copyToClipboard } from "@/lib/dashboard/clipboard";
import { useVeilData } from "@/lib/dashboard/veilStore";
import { useAuth, shortAddress } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { fetchPrefs, savePrefs } from "@/lib/veil/prefs";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  head: () => ({ meta: [{ title: "Profile · Veil" }] }),
  component: ProfilePage,
  errorComponent: ({ error, reset }) => (
    <div className="space-y-3 p-6 text-sm">
      <h2 className="font-display text-xl">Couldn't load your profile</h2>
      <p className="text-[color:var(--ds-muted)]">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-full border border-[color:var(--ds-border)] px-4 py-1.5 font-mono text-[11px] uppercase"
      >
        retry
      </button>
    </div>
  ),
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { orders } = useVeilData();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [notif, setNotif] = useState(true);
  const [adv, setAdv] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState("");
  const [linkSaved, setLinkSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    void fetchPrefs(user.address).then((p) => {
      if (p.linkedWallet) setLinkedWallet(p.linkedWallet);
    });
  }, [user]);

  async function copyAddr() {
    if (!user) return;
    if (await copyToClipboard(user.address)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Profile</h1>

      <DSCard>
        <div className="flex flex-wrap items-center gap-5">
          <div
            className="h-20 w-20 shrink-0 rounded-full border border-[color:var(--ds-border)]"
            style={{
              background: `conic-gradient(from 30deg, #a855f7, #ec4899, #f59e0b, #10b981, #a855f7)`,
            }}
            aria-label="avatar"
          />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
              {user.method === "wallet"
                ? "Sui Wallet"
                : user.method === "google"
                  ? "Google · zkLogin"
                  : "Email · zkLogin"}
            </div>
            <div className="mt-1 font-display text-2xl">{user.label}</div>
            <button
              onClick={copyAddr}
              className="mt-2 inline-flex items-center gap-2 font-mono text-[12px] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
            >
              {shortAddress(user.address, 8, 6)}
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-rose-400 transition-colors hover:bg-rose-500/20"
          >
            <LogOut className="h-3.5 w-3.5" /> Disconnect
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { l: "Orders placed", v: orders.length },
            { l: "Joined", v: new Date(user.createdAt).toLocaleDateString() },
            { l: "Auth method", v: user.method },
          ].map((x) => (
            <div
              key={x.l}
              className="rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-4"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                {x.l}
              </div>
              <div className="mt-1 text-sm">{x.v}</div>
            </div>
          ))}
        </div>
      </DSCard>

      <DSCard>
        <DSSectionTitle icon={Wallet} title="Connected wallet" />
        <p className="mt-4 max-w-prose text-sm text-[color:var(--ds-muted)]">
          {user.method === "google"
            ? "Google sign-in creates a Mysten zkLogin wallet — separate from Slash Wallet or your browser extension. Gas is sponsored on testnet. Link your main Sui address below if you want one identity across both."
            : "Veil never holds your private key. Every action is signed by your wallet or zkLogin proof."}
        </p>
        <div className="mt-4 rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-4 font-mono text-[12px]">
          <span className="text-[color:var(--ds-muted)]">active address </span>
          <span className="break-all">{user.address}</span>
        </div>

        <div className="mt-6 border-t border-[color:var(--ds-border)] pt-6">
          <DSSectionTitle icon={Link2} title="Link main wallet" />
          <p className="mt-3 text-sm text-[color:var(--ds-muted)]">
            Optional — store the Sui address you use elsewhere (e.g. extension wallet). Does not
            migrate funds; prefs only.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={linkedWallet}
              onChange={(e) => setLinkedWallet(e.target.value)}
              placeholder="0x…"
              className="min-w-[240px] flex-1 rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-4 py-2 font-mono text-[12px] outline-none focus:border-[color:var(--ds-accent)]"
            />
            <button
              type="button"
              onClick={() => {
                void savePrefs(user.address, { linkedWallet: linkedWallet.trim() || undefined }).then(
                  () => {
                    setLinkSaved(true);
                    setTimeout(() => setLinkSaved(false), 1500);
                  },
                );
              }}
              className="rounded-full border border-[color:var(--ds-border)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em]"
            >
              {linkSaved ? "Saved" : "Save link"}
            </button>
          </div>
        </div>
      </DSCard>

      <DSCard>
        <DSSectionTitle title="Preferences" />
        <ul className="mt-4 divide-y divide-[color:var(--ds-border)]">
          <Pref icon={Palette} title="Theme" desc="Switch between dark and light cockpit.">
            <div className="inline-flex rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-1 font-mono text-[10px] uppercase tracking-[0.15em]">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`rounded-full px-3 py-1 ${
                    theme === t
                      ? "bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)]"
                      : "text-[color:var(--ds-muted)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Pref>
          <Pref
            icon={Bell}
            title="Notifications"
            desc="Toast when a stealth order settles or a proof fails."
          >
            <Toggle on={notif} onChange={setNotif} />
          </Pref>
          <Pref
            icon={Shield}
            title="Advanced controls"
            desc="Show enclave PCR0 hashes and raw route paths inline."
          >
            <Toggle on={adv} onChange={setAdv} />
          </Pref>
        </ul>
      </DSCard>
    </div>
  );
}

function Pref({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ds-muted)]" />
        <div className="min-w-0">
          <div className="font-display text-base">{title}</div>
          <div className="text-[12px] text-[color:var(--ds-muted)]">{desc}</div>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`relative h-6 w-11 rounded-full border transition-colors ${
        on
          ? "border-emerald-500/40 bg-emerald-500/30"
          : "border-[color:var(--ds-border)] bg-[color:var(--ds-pill)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-[color:var(--ds-fg)] transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
