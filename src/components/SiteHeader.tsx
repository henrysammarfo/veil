import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useAuth, shortAddress } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { dashboardEntryPath, dashboardPath } from "@/lib/access";

const NAV = [
  { label: "STUDIO", to: "/studio" as const },
  { label: "WAITLIST", to: "/waitlist" as const },
  { label: "ABOUT", to: "/about" as const },
  { label: "ROADMAP", to: "/roadmap" as const },
  { label: "JOURNAL", to: "/journal" as const },
  { label: "REACH", to: "/reach" as const },
];

function NavLink({ label, to, onClick }: { label: string; to: string; onClick?: () => void }) {
  const [cycle, setCycle] = useState(0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setCycle((c) => c + 1)}
      onMouseLeave={() => setCycle((c) => c + 1)}
      className="group relative flex items-center justify-center overflow-hidden py-1 outline-none focus-visible:ring-1 focus-visible:ring-white/40"
    >
      {cycle === 0 ? (
        <span
          className={`transition-colors duration-300 group-hover:text-white ${
            active ? "text-white" : "text-white/64"
          }`}
        >
          {label}
        </span>
      ) : (
        <>
          <span key={`o-${cycle}`} className="animate-fly-out-up text-white">
            {label}
          </span>
          <span
            key={`i-${cycle}`}
            className="animate-fly-in-up absolute inset-0 flex items-center justify-center text-white"
          >
            {label}
          </span>
        </>
      )}
    </Link>
  );
}

/**
 * Shared header for every page. `variant="fixed"` is for the landing page
 * (parallax-out on scroll); `variant="sticky"` is for content/dashboard pages.
 */
export function SiteHeader({ variant = "sticky" }: { variant?: "fixed" | "sticky" }) {
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 500, 800], [0, 0, -150]);
  const { isAuthenticated, user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const ctaLabel = isAuthenticated ? "DASHBOARD" : "BEGIN JOURNEY";
  const ctaTo = isAuthenticated ? dashboardPath() : dashboardEntryPath();

  const isFixed = variant === "fixed";

  const containerClass = isFixed
    ? "fixed left-1/2 top-0 z-30 w-[90%] -translate-x-1/2"
    : "sticky top-0 z-30 mx-auto w-[90%] bg-black/60 backdrop-blur-[40px]";

  return (
    <motion.header
      style={isFixed ? { y: headerY } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`${containerClass} flex items-center justify-between py-4 md:py-6`}
    >
      <Link
        to="/"
        className="font-display text-2xl tracking-tight text-white outline-none focus-visible:ring-1 focus-visible:ring-white/40"
      >
        Veil<sup className="align-super text-[10px]">®</sup>
      </Link>

      <div className="hidden items-stretch lg:flex">
        <nav className="flex items-center gap-6 bg-[#1A1A1A]/40 px-6 font-mono text-xs tracking-[-0.01em] backdrop-blur-[80px]">
          {NAV.map((n) => (
            <NavLink key={n.to} label={n.label} to={n.to} />
          ))}
        </nav>
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle theme"
          className="ml-2 bg-white/8 px-4 text-white backdrop-blur-[80px] transition-colors hover:bg-white hover:text-black"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        {isAuthenticated ? (
          <div className="flex items-stretch">
            <Link
              to="/dashboard"
              className="bg-white/8 px-5 py-5 font-mono text-[11px] tracking-[-0.01em] text-white backdrop-blur-[80px] transition-colors hover:bg-white hover:text-black"
            >
              {shortAddress(user!.address)}
            </Link>
            <button
              type="button"
              onClick={() => {
                signOut();
                navigate({ to: "/" });
              }}
              className="bg-white px-5 py-5 font-mono text-[11px] font-bold tracking-[-0.01em] text-black transition-colors hover:bg-gray-200"
            >
              SIGN OUT
            </button>
          </div>
        ) : (
          <Link
            to={ctaTo}
            className="bg-white px-6 py-5 font-mono text-xs font-bold tracking-[-0.01em] text-black transition-colors hover:bg-gray-200"
          >
            {ctaLabel}
          </Link>
        )}
      </div>

      {/* Mobile / tablet */}
      <div className="flex items-center gap-2 lg:hidden">
        <Link
          to={ctaTo}
          className="bg-white px-4 py-3 font-mono text-[11px] font-bold tracking-[-0.01em] text-black transition-colors hover:bg-gray-200"
        >
          {ctaLabel}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle theme"
          className="bg-white/8 p-3 text-white backdrop-blur-[80px]"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          className="bg-white/8 p-3 text-white backdrop-blur-[80px]"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#0a0a0a]/95 p-6 backdrop-blur-[80px] lg:hidden">
          <nav className="flex flex-col gap-4 font-mono text-sm">
            {NAV.map((n) => (
              <NavLink key={n.to} label={n.label} to={n.to} onClick={() => setOpen(false)} />
            ))}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setOpen(false);
                  navigate({ to: "/" });
                }}
                className="self-start text-white/70 transition-colors hover:text-white"
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

/** Light shell used by all non-landing pages — header + bg + padding. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="veil-shell relative min-h-screen bg-black text-white">
      <SiteHeader variant="sticky" />
      <div className="mx-auto w-[90%] pb-32 pt-12 md:pt-20">{children}</div>
    </main>
  );
}
