import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { MockDataProvider } from "@/lib/dashboard/mockStore";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Veil" },
      {
        name: "description",
        content: "Veil cockpit — stealth orders, on-chain proofs, and Walrus archives.",
      },
    ],
  }),
  component: DashboardLayout,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="font-display text-2xl">Dashboard error</h1>
        <p className="text-sm text-white/60">{error.message}</p>
        <button onClick={reset} className="rounded-full border border-white/20 px-5 py-2 font-mono text-[11px] uppercase">retry</button>
      </div>
    </div>
  ),
});

function DashboardLayout() {
  return (
    <MockDataProvider>
      <DashboardShell>
        <Outlet />
      </DashboardShell>
    </MockDataProvider>
  );
}
