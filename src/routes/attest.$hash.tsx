import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/SiteHeader";
import { Reveal } from "@/components/Hero";
import { verifyAttestation } from "@/lib/veil/api";
import { VEIL_CONFIG } from "@/lib/veil/config";

export const Route = createFileRoute("/attest/$hash")({
  head: ({ params }) => ({
    meta: [{ title: `Attestation · ${params.hash.slice(0, 10)}… · Veil` }],
  }),
  component: AttestViewerPage,
});

function AttestViewerPage() {
  const { hash } = Route.useParams();
  const [valid, setValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void verifyAttestation(hash)
      .then(setValid)
      .catch(() => setValid(false))
      .finally(() => setLoading(false));
  }, [hash]);

  return (
    <PageShell>
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
          Public attestation viewer
        </p>
        <h1 className="mt-6 font-display text-[clamp(2rem,4vw,3.5rem)] font-medium leading-tight">
          {loading ? "Verifying…" : valid ? "Proof verified" : "Unknown attestation"}
        </h1>
      </Reveal>

      <div className="mt-10 max-w-2xl border border-white/10 bg-white/5 p-6 font-mono text-[12px]">
        <div className="text-white/40">Hash</div>
        <div className="mt-2 break-all text-white/90">{hash}</div>
        <div className="mt-6 text-white/40">Status</div>
        <div
          className={`mt-2 ${valid ? "text-emerald-400" : valid === false ? "text-red-400" : "text-white/60"}`}
        >
          {loading ? "Checking enclave store…" : valid ? "Valid — sealed by Veil enclave" : "Not found in store"}
        </div>
        <div className="mt-6 text-white/40">Enclave</div>
        <div className="mt-2 text-white/70">{VEIL_CONFIG.enclaveUrl}</div>
      </div>

      <Link
        to="/waitlist"
        className="mt-8 inline-block font-mono text-[11px] uppercase tracking-wider text-white/50 hover:text-white"
      >
        ← Join waitlist for beta access
      </Link>
    </PageShell>
  );
}
