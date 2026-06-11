import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { DSCard, DSSectionTitle } from "@/components/DashboardShell";
import { ProofConsole } from "@/components/dashboard/ProofConsole";
import { useMockData } from "@/lib/dashboard/mockStore";

export const Route = createFileRoute("/_authenticated/dashboard/proofs")({
  head: () => ({ meta: [{ title: "Proofs · Veil" }] }),
  component: ProofsPage,
  errorComponent: ({ error, reset }) => (
    <div className="space-y-3 p-6 text-sm">
      <h2 className="font-display text-xl">Couldn't load the proof console</h2>
      <p className="text-[color:var(--ds-muted)]">{error.message}</p>
      <button onClick={reset} className="rounded-full border border-[color:var(--ds-border)] px-4 py-1.5 font-mono text-[11px] uppercase">retry</button>
    </div>
  ),
});

function ProofsPage() {
  const { proofs, refresh, lastTick } = useMockData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">Proof Console</h1>
        <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
          Every action the enclave takes is signed by a TEE and posted on-chain.
          Filter by tag, search by hash, copy any line.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { l: "Total proofs", v: proofs.length },
          { l: "Attestations", v: proofs.filter((p) => p.tag === "ATTEST").length },
          { l: "Settlements", v: proofs.filter((p) => p.tag === "SETTLE").length },
          { l: "Last update", v: new Date(lastTick).toLocaleTimeString() },
        ].map((s) => (
          <DSCard key={s.l}>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">{s.l}</div>
            <div className="mt-2 font-display text-2xl">{s.v}</div>
          </DSCard>
        ))}
      </div>

      <DSCard>
        <DSSectionTitle
          icon={ShieldCheck}
          title="Live stream"
          action={
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] hover:bg-[color:var(--ds-hover)]"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          }
        />
        <div className="mt-5">
          <ProofConsole max={50} />
        </div>
      </DSCard>
    </div>
  );
}
