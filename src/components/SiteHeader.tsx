import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useAuth, shortAddress } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { dashboardPath, canAccessDashboard, headerCtaLabel, headerCtaPath } from "@/lib/access";

const NAV = [
  { label: "STUDIO", to: "/studio" as const },
  { label: "WAITLIST", to: "/waitlist" as const },
  { label: "ABOUT", to: "/about" as const },
  { label: "ROADMAP", to: "/roadmap" as const },
  { label: "JOURNAL", to: "/journal" as const },
  { label: "REACH", to: "/reach" as const },
];

function NavLink({
  label,
  to,
  onClick,
  variant = "bar",
}: {
  label: string;
  to: string;
  onClick?: () => void;
  variant?: "bar" | "drawer";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === to;
  const base =
    variant === "drawer"
      ? "site-drawer-link block py-1 text-[15px]"
      : "site-nav-link relative flex items-center justify-center overflow-hidden py-1 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--site-ring)]";

  return (
    <Link to={to} onClick={onClick} className={base} data-active={active || undefined}>
      {label}
    </Link>
  );
}

export function SiteHeader({ variant = "sticky" }: { variant?: "fixed" | "sticky" }) {
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 500, 800], [0, 0, -150]);
  const { isAuthenticated, user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (headerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const canDash = canAccessDashboard();
  const ctaLabel = headerCtaLabel(isAuthenticated);
  const ctaTo = headerCtaPath(isAuthenticated);
  const isFixed = variant === "fixed";
  const onLanding = isFixed;

  const containerClass = isFixed
    ? "site-header site-header--landing fixed left-1/2 top-0 z-30 w-[90%] -translate-x-1/2"
    : "site-header site-header--page sticky top-0 z-30 mx-auto w-[90%] border-b border-[color:var(--site-border)] backdrop-blur-xl";

  const iconBtn =
    "site-icon-btn flex items-center justify-center px-4 py-3 transition-colors";
  const ctaBtn =
    "site-cta-btn px-6 py-5 font-mono text-xs font-bold tracking-[-0.01em] transition-colors";

  return (
    <motion.header
      ref={headerRef}
      style={isFixed ? { y: headerY } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`${containerClass} flex items-center justify-between py-4 md:py-6`}
      data-landing={onLanding || undefined}
    >
      <Link
        to="/"
        className="site-logo font-display text-2xl tracking-tight outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--site-ring)]"
      >
        Veil<sup className="align-super text-[10px]">®</sup>
      </Link>

      <div className="hidden items-stretch lg:flex">
        <nav className="site-nav-pill flex items-center gap-6 px-6 font-mono text-xs tracking-[-0.01em]">
          {NAV.map((n) => (
            <NavLink key={n.to} label={n.label} to={n.to} />
          ))}
        </nav>
        {!onLanding && (
          <button type="button" onClick={toggle} aria-label="Toggle theme" className={`${iconBtn} ml-2`}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
        {isAuthenticated && canDash ? (
          <div className="flex items-stretch">
            <Link to={dashboardPath()} className={`${iconBtn} font-mono text-[11px]`}>
              {shortAddress(user!.address)}
            </Link>
            <button
              type="button"
              onClick={() => {
                signOut();
                navigate({ to: "/" });
              }}
              className={`${ctaBtn} site-cta-btn--solid`}
            >
              SIGN OUT
            </button>
          </div>
        ) : isAuthenticated ? (
          <div className="flex items-stretch">
            <span className={`${iconBtn} font-mono text-[11px] opacity-70`}>
              {shortAddress(user!.address)}
            </span>
            <Link to={ctaTo} className={`${ctaBtn} site-cta-btn--solid`}>
              {ctaLabel}
            </Link>
          </div>
        ) : (
          <Link to={ctaTo} className={`${ctaBtn} site-cta-btn--solid`}>
            {ctaLabel}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <Link to={ctaTo} className={`${ctaBtn} site-cta-btn--solid px-4 py-3 text-[11px]`}>
          {ctaLabel}
        </Link>
        {!onLanding && (
          <button type="button" onClick={toggle} aria-label="Toggle theme" className={iconBtn}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" className={iconBtn}>
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="site-drawer absolute left-0 right-0 top-full mt-2 p-6 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-4 font-mono">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                label={n.label}
                to={n.to}
                variant="drawer"
                onClick={() => setOpen(false)}
              />
            ))}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setOpen(false);
                  navigate({ to: "/" });
                }}
                className="site-drawer-link self-start py-1 text-[15px] opacity-70"
              >
                SIGN OUT
              </button>
            )}
          </nav>
        </div>
      )}
    </motion.header>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="veil-shell relative min-h-screen">
      <SiteHeader variant="sticky" />
      <div className="mx-auto w-[90%] pb-32 pt-12 md:pt-20">{children}</div>
    </main>
  );
}
