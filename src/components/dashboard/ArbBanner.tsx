import { useArbAlert } from "@/lib/veil/hooks";

export function ArbBanner() {
  const arb = useArbAlert("btc");
  if (!arb?.arbDetected) return null;

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
      Polymarket gap: <strong>+{arb.gapPct.toFixed(0)} pts</strong> on BTC — DeepBook implied{" "}
      {arb.deepbook != null ? `${(arb.deepbook * 100).toFixed(0)}%` : "—"} vs Polymarket{" "}
      {arb.polymarket != null ? `${(arb.polymarket * 100).toFixed(0)}%` : "—"}
    </div>
  );
}
