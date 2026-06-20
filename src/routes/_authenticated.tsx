import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { canAccessDashboard } from "@/lib/access";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!canAccessDashboard()) {
      navigate({ to: "/waitlist", replace: true });
      return;
    }
    if (!isAuthenticated) {
      navigate({
        to: "/auth",
        search: { redirect: window.location.pathname },
        replace: true,
      });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !canAccessDashboard() || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
          Verifying session…
        </span>
      </main>
    );
  }

  return <Outlet />;
}
