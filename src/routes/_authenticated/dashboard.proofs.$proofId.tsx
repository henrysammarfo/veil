import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Copy, Check, ShieldCheck, ExternalLink, Activity } from "lucide-react";
import { DSCard, DSEmpty, DSSectionTitle } from "@/components/DashboardShell";
import { copyToClipboard } from "@/lib/dashboard/clipboard";
import { useVeilData } from "@/lib/dashboard/veilStore";
import type { ProofTag } from "@/lib/dashboard/types";

export const Route = createFileRoute("/_authenticated/dashboard/proofs/$proofId")({
  head: ({ params }) => ({ meta: [{ title: `Proof ${params.proofId} · Veil` }] }),
  component: ProofDetailPage,
  errorComponent: ({ error, reset }) => (
    <div className="space-y-3 p-6 text-sm">
      <h2 className="font-display text-xl">Couldn't load this proof</h2>
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

const TAG_COLOR: Record<ProofTag, string> = {
  ATTEST: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  SETTLE: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  ROUTE: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  ORDER: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  WALRUS: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  ERROR: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

function ProofDetailPage() {
  const { proofId } = useParams({ from: "/_authenticated/dashboard/proofs/$proofId" });
  const { getProof, getOrder } = useVeilData();
  const proof = getProof(proofId);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(name: string, value: string) {
    if (await copyToClipboard(value)) {
      setCopied(name);
      setTimeout(() => setCopied(null), 1400);
    }
  }

  if (!proof) {
    return (
      <DSEmpty
        icon={ShieldCheck}
        title="Proof not found"
        body={`No proof with id ${proofId} in your execution history. Check MemWal provenance or place a new order.`}
        cta={
          <Link
            to="/dashboard/proofs"
            className="rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em]"
          >
            Back to Proofs
          </Link>
        }
      />
    );
  }

  const order = proof.orderId ? getOrder(proof.orderId) : undefined;
  const payloadJson = JSON.stringify(
    {
      id: proof.id,
      tag: proof.tag,
      hash: proof.hash,
      orderId: proof.orderId,
      enclave: proof.enclave,
      pcr0: proof.pcr0,
      txDigest: proof.txDigest,
      capturedAt: new Date(proof.createdAt).toISOString(),
      payload: proof.payload ?? {},
    },
    null,
    2,
  );

  const fields: Array<{ k: string; v: string | undefined }> = [
    { k: "Proof ID", v: proof.id },
    { k: "Tag", v: proof.tag },
    { k: "Hash", v: proof.hash },
    { k: "Enclave", v: proof.enclave },
    { k: "PCR0", v: proof.pcr0 },
    { k: "Sui digest", v: proof.txDigest },
    { k: "Order", v: proof.orderId },
    { k: "Captured", v: new Date(proof.createdAt).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/proofs"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
      >
        <ArrowLeft className="h-3 w-3" /> All proofs
      </Link>

      <DSCard>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em]">
              <span className={`rounded border px-1.5 py-0.5 ${TAG_COLOR[proof.tag]}`}>
                {proof.tag}
              </span>
              <span className="text-[color:var(--ds-muted)]">{proof.t}</span>
            </div>
            <h1 className="mt-3 break-words font-display text-[clamp(1.5rem,2.6vw,2.25rem)] leading-tight">
              {proof.text}
            </h1>
          </div>
          <button
            onClick={() => copy("hash", proof.hash)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1.5 font-mono text-[11px] hover:bg-[color:var(--ds-hover)]"
          >
            {copied === "hash" ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            Copy hash
          </button>
        </div>

        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          {fields
            .filter((f) => f.v)
            .map((f) => (
              <div
                key={f.k}
                className="rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-4"
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                  {f.k}
                </dt>
                <dd className="mt-1 flex items-center justify-between gap-2 break-all font-mono text-[12px]">
                  <span className="min-w-0 truncate">{f.v}</span>
                  <button
                    onClick={() => copy(f.k, f.v as string)}
                    aria-label={`Copy ${f.k}`}
                    className="shrink-0 text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                  >
                    {copied === f.k ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </dd>
              </div>
            ))}
        </dl>
      </DSCard>

      {order && (
        <DSCard>
          <DSSectionTitle icon={Activity} title="Related order" />
          <Link
            to="/dashboard/orders/$orderId"
            params={{ orderId: order.id }}
            className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-4 hover:bg-[color:var(--ds-hover)]"
          >
            <div className="min-w-0">
              <div className="font-mono text-[11px] text-[color:var(--ds-muted)]">
                {order.id} · {order.asset}
              </div>
              <div className="mt-1 truncate text-sm">{order.intent}</div>
            </div>
            <ExternalLink className="h-4 w-4 text-[color:var(--ds-muted)]" />
          </Link>
        </DSCard>
      )}

      <DSCard>
        <DSSectionTitle
          title="Proof payload"
          action={
            <button
              onClick={() => copy("payload", payloadJson)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] hover:bg-[color:var(--ds-hover)]"
            >
              {copied === "payload" ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              Copy JSON
            </button>
          }
        />
        <pre className="no-scrollbar mt-5 max-h-[420px] overflow-auto rounded-lg border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-4 font-mono text-[11px] leading-relaxed text-[color:var(--ds-fg)]">
          {payloadJson}
        </pre>
      </DSCard>
    </div>
  );
}
