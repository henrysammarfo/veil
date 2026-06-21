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
    return `${usd >= 0 ? "+" : ""}$${Math.abs(usd).toFixed(2)} settled in dUSDC`;
  }
  if (o.slices.filled === 0 && o.state === "EXECUTING") {
    return "queued, no on-chain fills yet";
  }
  if (o.pnlKind === "expected") {
    return "model estimate, not settled yet";
  }
  if (o.state === "SETTLED" && o.realizedPnlUsd == null) {
    return "awaiting keeper redeem";
  }
  return o.stealth ? "stealth, pending settlement" : "pending";
}
