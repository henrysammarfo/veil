import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Activity,
  ShieldCheck,
  Archive,
  BarChart3,
  Bot,
  Landmark,
  Compass,
  Sun,
  Moon,
  LogOut,
  User,
  Copy,
  Check,
  Menu,
  X,
} from "lucide-react";
import { useAuth, shortAddress } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useCockpitMode } from "@/lib/dashboard/ModeProvider";

/* Dashboard-only navbar, Veil-themed. Mobile: horizontally scrollable pill +
   collapsible secondary group inside a sheet. */

const PRIMARY = [
  { to: "/dashboard" as const, icon: Home, label: "Home", exact: true },
  { to: "/dashboard/orders" as const, icon: Activity, label: "Orders" },
  { to: "/dashboard/proofs" as const, icon: ShieldCheck, label: "Proofs" },
  { to: "/dashboard/liquidity" as const, icon: Archive, label: "Archive" },
] as const;

const SECONDARY = [
  { to: "/dashboard/discover" as const, icon: Compass, label: "Discover" },
  { to: "/dashboard/agents" as const, icon: Bot, label: "Engines" },
  { to: "/dashboard/stats" as const, icon: BarChart3, label: "Stats" },
  { to: "/dashboard/portfolio" as const, icon: Landmark, label: "Portfolio" },
] as const;

type NavItem = { to: string; icon: React.ComponentType<{ className?: string }>; label: string; exact?: boolean };

function NavPill({ items }: { items: ReadonlyArray<NavItem> }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex items-center gap-1 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-1">
      {items.map((it) => {
        const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            aria-label={it.label}
            title={it.label}
            className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${
              active
                ? "bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)]"
                : "text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </Link>
        );
      })}
    </div>
  );
}

function WalletMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function copy() {
    if (!user) return;
    try {
      await navigator.clipboard?.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-[color:var(--ds-border)]"
        style={{ background: `conic-gradient(from 30deg, #a855f7, #ec4899, #f59e0b, #10b981, #a855f7)` }}
        aria-label="Account menu"
      >
        <span className="sr-only">Account</span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-surface)] p-3 shadow-2xl">
          <div className="px-2 pb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">Wallet</div>
            <button onClick={copy} className="mt-1 flex w-full items-center justify-between font-mono text-[13px] text-[color:var(--ds-fg)]">
              {user ? shortAddress(user.address, 6, 4) : ""}
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-[color:var(--ds-muted)]" />}
            </button>
          </div>
          <div className="border-t border-[color:var(--ds-border)] pt-2">
            <Link
              to="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[color:var(--ds-fg)] transition-colors hover:bg-[color:var(--ds-hover)]"
            >
              <User className="h-4 w-4" /> Profile
            </Link>
            <button
              onClick={() => { signOut(); navigate({ to: "/" }); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-[color:var(--ds-hover)]"
            >
              <LogOut className="h-4 w-4" /> Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const { mode, setMode } = useCockpitMode();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="ds-root min-h-screen bg-[color:var(--ds-bg)] text-[color:var(--ds-fg)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--ds-border)] bg-[color:var(--ds-bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-2 px-3 py-3 sm:px-4 md:px-8 md:py-5">
          {/* left cluster */}
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <Link to="/" className="shrink-0 font-display text-xl leading-none tracking-tight md:text-2xl" aria-label="Veil home">
              Veil<sup className="align-super text-[10px]">®</sup>
            </Link>
            <div className="hidden md:flex items-center gap-3">
              <NavPill items={PRIMARY} />
              <NavPill items={SECONDARY} />
            </div>
          </div>

          {/* right cluster */}
          <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
            {/* Lite / Pro mode switch — Binance style */}
            <div className="hidden sm:flex items-center rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-0.5 font-mono text-[10px] uppercase tracking-[0.15em]">
              {(["lite", "pro"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`rounded-full px-2.5 py-1 transition-colors ${
                    mode === m
                      ? "bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)]"
                      : "text-[color:var(--ds-muted)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--ds-border)] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)] md:h-10 md:w-10"
            >
              {theme === "dark" ? <Sun className="h-[16px] w-[16px]" /> : <Moon className="h-[16px] w-[16px]" />}
            </button>
            <WalletMenu />
            <button
              onClick={() => setMenuOpen((m) => !m)}
              aria-label="Toggle navigation"
              className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--ds-border)] text-[color:var(--ds-muted)] md:hidden"
            >
              {menuOpen ? <X className="h-[16px] w-[16px]" /> : <Menu className="h-[16px] w-[16px]" />}
            </button>
          </div>
        </div>


        {/* mobile nav — horizontal scroll pills */}
        <div className="border-t border-[color:var(--ds-border)] md:hidden">
          <div className="no-scrollbar mx-auto flex max-w-full gap-2 overflow-x-auto px-4 py-2">
            {([...PRIMARY, ...SECONDARY] as ReadonlyArray<NavItem>).map((it) => {
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  activeOptions={{ exact: it.exact ?? false }}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[color:var(--ds-muted)] [&.active]:bg-[color:var(--ds-accent)] [&.active]:text-[color:var(--ds-accent-fg)]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[color:var(--ds-border)] md:hidden">
            <div className="mx-auto max-w-full space-y-3 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">Mode</span>
                <div className="flex items-center rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-0.5 font-mono text-[10px] uppercase tracking-[0.15em]">
                  {(["lite", "pro"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`rounded-full px-3 py-1 transition-colors ${
                        mode === m ? "bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)]" : "text-[color:var(--ds-muted)]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <Link to="/dashboard/profile" onClick={() => setMenuOpen(false)} className="block py-2">Profile</Link>
              <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2 text-[color:var(--ds-muted)]">Back to site</Link>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-4 md:px-8 md:pt-6">{children}</main>
    </div>
  );
}

/* ---------- shared card primitives ---------- */

export function DSCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`ds-glass rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-surface)] p-5 transition-colors md:p-7 ${className}`}>
      {children}
    </div>
  );
}

export function DSSectionTitle({
  icon: Icon, title, action,
}: { icon?: React.ComponentType<{ className?: string }>; title: string; action?: React.ReactNode }) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h2 className="flex min-w-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{title}</span>
      </h2>
      {action}
    </header>
  );
}

export function DSSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[color:var(--ds-skeleton)] ${className}`} />;
}

export function DSEmpty({
  icon: Icon, title, body, cta,
}: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center md:py-14">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-[color:var(--ds-border)] text-[color:var(--ds-muted)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-xl text-[color:var(--ds-fg)]">{title}</div>
      <p className="max-w-sm text-sm leading-relaxed text-[color:var(--ds-muted)]">{body}</p>
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}
