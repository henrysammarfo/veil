import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { DSCard, DSSectionTitle } from "@/components/DashboardShell";
import { ProofConsole } from "@/components/dashboard/ProofConsole";
import { RefreshBar } from "@/components/dashboard/RefreshBar";
import { useVeilData } from "@/lib/dashboard/veilStore";

export const Route = createFileRoute("/_authenticated/dashboard/proofs")({
  head: () => ({ meta: [{ title: "Proofs · Veil" }] }),
  component: ProofsPage,
  errorComponent: ({ error, reset }) => (
    <div className="space-y-3 p-6 text-sm">
      <h2 className="font-display text-xl">Couldn't load the proof console</h2>
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

function ProofsPage() {
  const { proofs, ticks } = useVeilData();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight">
            Proof Console
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[color:var(--ds-muted)]">
            Every action the enclave takes is signed by a TEE and posted on-chain. Filter by tag,
            search by hash, copy any line — or open a proof for full metadata.
          </p>
        </div>
        <RefreshBar resource="proofs" label="proofs" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Total proofs", v: proofs.length },
          { l: "Attestations", v: proofs.filter((p) => p.tag === "ATTEST").length },
          { l: "Settlements", v: proofs.filter((p) => p.tag === "SETTLE").length },
          { l: "Last update", v: new Date(ticks.proofs).toLocaleTimeString() },
        ].map((s) => (
          <DSCard key={s.l} className="!p-4 md:!p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
              {s.l}
            </div>
            <div className="mt-2 font-display text-2xl">{s.v}</div>
          </DSCard>
        ))}
      </div>

      <DSCard>
        <DSSectionTitle icon={ShieldCheck} title="Live stream" />
        <p className="mt-2 text-[12px] text-[color:var(--ds-muted)]">
          Tip: click a line to open its full proof payload, related order, and verifier link.
        </p>
        <div className="mt-5">
          <ProofConsole max={50} linkEach />
        </div>
      </DSCard>

      <DSCard className="!py-4">
        <p className="text-[12px] text-[color:var(--ds-muted)]">
          Looking for a specific proof?{" "}
          <Link to="/dashboard/proofs" className="underline">
            Filter by tag
          </Link>{" "}
          or paste a hash in the search box above.
        </p>
      </DSCard>
    </div>
  );
}
