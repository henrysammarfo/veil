import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  BarChart3,
  Bot,
  Landmark,
  Droplets,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Copy,
} from "lucide-react";
import { useAuth, shortAddress } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";

/* ----------------------------------------------------------------
 * Dashboard-only navbar.  No marketing links here — this is the
 * cockpit nav (Home / Discover / Stats / Agents / Portfolio / Liquidity)
 * inspired by Aionis, themed for Veil (Instrument Serif logo, mono labels,
 * supports dark + light via the global ThemeProvider).
 * ---------------------------------------------------------------- */

const PRIMARY = [
  { to: "/dashboard" as const, icon: Home, label: "Home", exact: true },
  { to: "/dashboard/discover" as const, icon: Compass, label: "Discover" },
] as const;

const SECONDARY = [
  { to: "/dashboard/stats" as const, icon: BarChart3, label: "Stats" },
  { to: "/dashboard/agents" as const, icon: Bot, label: "Agents" },
  { to: "/dashboard/portfolio" as const, icon: Landmark, label: "Portfolio" },
  { to: "/dashboard/liquidity" as const, icon: Droplets, label: "Liquidity" },
] as const;

function NavPill({
  items,
}: {
  items: ReadonlyArray<{
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    exact?: boolean;
  }>;
}) {
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function copy() {
    if (user) navigator.clipboard?.writeText(user.address);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-[color:var(--ds-border)]"
        style={{
          background: `conic-gradient(from 30deg, #a855f7, #ec4899, #f59e0b, #10b981, #a855f7)`,
        }}
        aria-label="Account menu"
      >
        <span className="sr-only">Account</span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-surface)] p-3 shadow-2xl">
          <div className="px-2 pb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
              Wallet
            </div>
            <button
              onClick={copy}
              className="mt-1 flex w-full items-center justify-between font-mono text-[13px] text-[color:var(--ds-fg)]"
            >
              {user ? shortAddress(user.address, 6, 4) : ""}
              <Copy className="h-3.5 w-3.5 text-[color:var(--ds-muted)]" />
            </button>
          </div>
          <div className="border-t border-[color:var(--ds-border)] pt-2">
            <Link
              to="/dashboard/portfolio"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[color:var(--ds-fg)] transition-colors hover:bg-[color:var(--ds-hover)]"
            >
              <User className="h-4 w-4" /> View profile
            </Link>
            <button
              onClick={() => {
                signOut();
                navigate({ to: "/" });
              }}
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
  return (
    <div className="ds-root min-h-screen bg-[color:var(--ds-bg)] text-[color:var(--ds-fg)]">
      <header className="sticky top-0 z-40 mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="font-display text-2xl leading-none tracking-tight"
            aria-label="Veil home"
          >
            Veil<sup className="align-super text-[10px]">®</sup>
          </Link>
          <NavPill items={PRIMARY} />
          <NavPill items={SECONDARY} />
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[11px] text-[color:var(--ds-muted)] md:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Agent Network: <span className="text-emerald-400">Live</span>
          </span>
          <button
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--ds-border)] text-[color:var(--ds-muted)] transition-colors hover:text-[color:var(--ds-fg)]"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)]"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          <WalletMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] px-5 pb-24 pt-2 md:px-8">{children}</main>
    </div>
  );
}

/* ---------- shared card primitives ---------- */

export function DSCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-surface)] p-6 transition-colors md:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

export function DSSectionTitle({
  icon: Icon,
  title,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {title}
      </h2>
      {action}
    </header>
  );
}

export function DSSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[color:var(--ds-skeleton)] ${className}`}
    />
  );
}

export function DSEmpty({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-[color:var(--ds-border)] text-[color:var(--ds-muted)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-xl text-[color:var(--ds-fg)]">{title}</div>
      <p className="max-w-sm text-sm leading-relaxed text-[color:var(--ds-muted)]">
        {body}
      </p>
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}
