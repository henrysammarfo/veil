import type { Order } from "./types";

export function pnlColorClass(o: Order): string {
  if (o.isLoss || (o.realizedPnlUsd ?? 0) < -0.001) return "text-red-400";
  if (o.isProfit || (o.realizedPnlUsd ?? 0) > 0.001) return "text-emerald-400";
  if (o.pnlKind === "expected") return "text-amber-300";
  return "text-[color:var(--ds-muted)]";
}

export function pnlLabel(o: Order): string {
  if (o.realizedPnlUsd != null) return o.realizedPnl ?? o.pnl;
  return o.pnl;
}

export function pnlSubLabel(o: Order): string {
  if (o.realizedPnlUsd != null) {
    const usd = o.realizedPnlUsd;
    return `${usd >= 0 ? "+" : ""}$${Math.abs(usd).toFixed(2)} realized`;
  }
  if (o.pnlKind === "expected") return "expected · stealth";
  return o.stealth ? "stealth · pending settlement" : "pending";
}
