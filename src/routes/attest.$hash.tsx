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
        <p className="page-eyebrow">Public attestation viewer</p>
        <h1 className="mt-6 font-display text-[clamp(2rem,4vw,3.5rem)] font-medium leading-tight">
          {loading ? "Verifying…" : valid ? "Proof verified" : "Unknown attestation"}
        </h1>
      </Reveal>

      <div className="page-form-box mt-10 max-w-2xl p-6 font-mono text-[12px]">
        <div className="page-eyebrow-sm">Hash</div>
        <div className="page-body mt-2 break-all">{hash}</div>
        <div className="page-eyebrow-sm mt-6">Status</div>
        <div
          className={`mt-2 ${valid ? "text-emerald-500" : valid === false ? "text-red-500" : "page-muted"}`}
        >
          {loading ? "Checking enclave store…" : valid ? "Valid — sealed by Veil enclave" : "Not found in store"}
        </div>
        <div className="page-eyebrow-sm mt-6">Enclave</div>
        <div className="page-muted mt-2">{VEIL_CONFIG.enclaveUrl}</div>
      </div>

      <Link
        to="/waitlist"
        className="page-muted mt-8 inline-block font-mono text-[11px] uppercase tracking-wider hover:text-[color:var(--site-fg)]"
      >
        ← Join waitlist for beta access
      </Link>
    </PageShell>
  );
}
