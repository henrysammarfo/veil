import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ShieldCheck, Landmark, BarChart3, Plus } from "lucide-react";
import { useState } from "react";
import { NewOrderDialog } from "./NewOrderDialog";

const ITEMS = [
  { to: "/dashboard" as const, label: "Home", icon: Home, exact: true },
  { to: "/dashboard/proofs" as const, label: "Proofs", icon: ShieldCheck },
  { to: "/dashboard/portfolio" as const, label: "Portfolio", icon: Landmark },
  { to: "/dashboard/stats" as const, label: "Stats", icon: BarChart3 },
] as const;

/**
 * Mobile-only bottom navigation. Fixed to the viewport; safe-area aware.
 * Center FAB opens the New Order dialog so the primary action is always
 * one tap away in mobile.
 */
export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openOrder, setOpenOrder] = useState(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--ds-border)] bg-[color:var(--ds-bg)]/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-1.5">
          {ITEMS.slice(0, 2).map((it) => {
            const active = "exact" in it && it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return <NavCell key={it.to} item={it} active={active} />;
          })}
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => setOpenOrder(true)}
              aria-label="New order"
              className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-[color:var(--ds-accent)] text-[color:var(--ds-accent-fg)] shadow-lg shadow-amber-500/30"
            >
              <Plus className="h-5 w-5" />
            </button>
          </li>
          {ITEMS.slice(2).map((it) => (
            <NavCell key={it.to} item={it} active={pathname.startsWith(it.to)} />
          ))}
        </ul>
      </nav>
      <NewOrderDialog open={openOrder} onClose={() => setOpenOrder(false)} />
    </>
  );
}

function NavCell({ item, active }: { item: (typeof ITEMS)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        to={item.to}
        className={`flex flex-col items-center gap-0.5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
          active ? "text-[color:var(--ds-fg)]" : "text-[color:var(--ds-muted)]"
        }`}
      >
        <Icon className={`h-5 w-5 ${active ? "text-[color:var(--ds-accent)]" : ""}`} />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}
