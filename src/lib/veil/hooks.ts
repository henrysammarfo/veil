import { useEffect, useState } from "react";
import { fetchArb, fetchSvi } from "./api";

export interface SviPoint {
  sigma: number;
  updatedAtMs: number;
}

export function useLiveSvi(pollMs = 8000) {
  const [svi, setSvi] = useState<SviPoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchSvi();
        if (!cancelled && data) {
          setSvi({ sigma: Number(data.sigma ?? 0), updatedAtMs: Date.now() });
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "svi error");
      }
    };
    void load();
    const id = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return { svi, error };
}

export function useLiveForward(pollMs = 15_000) {
  const [forwardUsd, setForwardUsd] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = (await fetchArb("btc", 0)) as { forwardUsd?: number } | null;
        if (!cancelled && data?.forwardUsd) setForwardUsd(data.forwardUsd);
      } catch {
        /* optional */
      }
    };
    void load();
    const id = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);
  return forwardUsd;
}

export function useArbAlert(asset = "btc", strikeUsd?: number) {
  const forward = useLiveForward();
  const strike = strikeUsd ?? (forward ? Math.round(forward) : undefined);
  const [arb, setArb] = useState<{
    arbDetected: boolean;
    gapPct: number;
    polymarket: number | null;
    deepbook: number | null;
  } | null>(null);

  useEffect(() => {
    if (!strike) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = (await fetchArb(asset, strike)) as {
          polymarket: number | null;
          deepbook: number;
          arb: { arbDetected: boolean; gapPct: number };
        };
        if (!cancelled) {
          setArb({
            arbDetected: data.arb?.arbDetected ?? false,
            gapPct: data.arb?.gapPct ?? 0,
            polymarket: data.polymarket,
            deepbook: data.deepbook ?? null,
          });
        }
      } catch {
        /* API optional */
      }
    };
    void load();
    const id = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [asset, strike]);

  return arb;
}
