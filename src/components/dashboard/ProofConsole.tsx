import { useMemo, useState } from "react";
import { Copy, Check, FileSearch, Search } from "lucide-react";
import { DSEmpty, DSSkeleton } from "@/components/DashboardShell";
import { copyToClipboard, useMockData, type ProofTag } from "@/lib/dashboard/mockStore";

const ALL_TAGS: ProofTag[] = ["ATTEST", "SETTLE", "ROUTE", "ORDER", "WALRUS", "ERROR"];

const TAG_COLOR: Record<ProofTag, string> = {
  ATTEST: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  SETTLE: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  ROUTE:  "text-violet-400 bg-violet-500/10 border-violet-500/20",
  ORDER:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  WALRUS: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  ERROR:  "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

export function ProofConsole({
  max = 25,
  showFilters = true,
  showSearch = true,
}: {
  max?: number;
  showFilters?: boolean;
  showSearch?: boolean;
}) {
  const { proofs, loading } = useMockData();
  const [active, setActive] = useState<Set<ProofTag>>(new Set());
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  function toggle(t: ProofTag) {
    setActive((cur) => {
      const next = new Set(cur);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return proofs.filter((p) => {
      if (active.size && !active.has(p.tag)) return false;
      if (q && !(p.text.toLowerCase().includes(q) || p.hash.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [proofs, active, query]);

  async function copy(hash: string) {
    const ok = await copyToClipboard(hash);
    if (ok) {
      setCopied(hash);
      setTimeout(() => setCopied(null), 1400);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {(showFilters || showSearch) && (
        <div className="flex flex-wrap items-center gap-2">
          {showFilters && ALL_TAGS.map((t) => {
            const on = active.has(t);
            return (
              <button
                key={t}
                onClick={() => toggle(t)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${
                  on
                    ? TAG_COLOR[t]
                    : "border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
                }`}
              >
                {t}
              </button>
            );
          })}
          {active.size > 0 && (
            <button
              onClick={() => setActive(new Set())}
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
            >
              clear
            </button>
          )}
          {showSearch && (
            <div className="ml-auto flex min-w-[180px] items-center gap-2 rounded-full border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-1.5">
              <Search className="h-3 w-3 text-[color:var(--ds-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="hash or text…"
                className="w-full bg-transparent font-mono text-[11px] text-[color:var(--ds-fg)] outline-none placeholder:text-[color:var(--ds-muted)]"
              />
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <DSSkeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <DSEmpty
          icon={FileSearch}
          title="No proofs match."
          body={
            active.size || query
              ? "Try clearing filters or your search query."
              : "When the enclave posts its next attestation, it will appear here in real time."
          }
        />
      ) : (
        <ul className="max-h-[420px] divide-y divide-[color:var(--ds-border)] overflow-auto rounded-lg border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)]">
          {filtered.slice(0, max).map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-3 px-3 py-2.5 font-mono text-[11px] leading-relaxed transition-colors hover:bg-[color:var(--ds-hover)]"
            >
              <span className="shrink-0 text-[color:var(--ds-muted)]">{p.t}</span>
              <span
                className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] ${TAG_COLOR[p.tag]}`}
              >
                {p.tag}
              </span>
              <span className="min-w-0 break-words text-[color:var(--ds-fg)]">{p.text}</span>
              <button
                onClick={() => copy(p.hash)}
                aria-label="Copy proof hash"
                className="shrink-0 text-[color:var(--ds-muted)] transition-colors hover:text-[color:var(--ds-fg)]"
                title={p.hash}
              >
                {copied === p.hash ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
