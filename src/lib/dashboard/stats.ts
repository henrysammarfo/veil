import type { DashboardStats, Order, Proof } from "./types";
import { isActiveOrder } from "./orderStatus";

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

export function computeStats(orders: Order[], proofs: Proof[]): DashboardStats {
  const now = Date.now();
  const dayMs = 86_400_000;
  const open = orders.filter(isActiveOrder);
  const vol24 = orders
    .filter((o) => now - o.createdAt <= dayMs)
    .reduce((s, o) => s + (o.sizeUsdc ?? 0), 0);
  const deployedNotional = orders
    .filter(isActiveOrder)
    .reduce((s, o) => s + (o.sizeUsdc ?? 0), 0);
  const totalRealizedPnlUsd = orders.reduce(
    (s, o) => s + (o.realizedPnlUsd ?? (o.pnlKind === "realized" ? (o.pnlUsd ?? 0) : 0)),
    0,
  );
  const totalExpectedPnlUsd = orders.reduce(
    (s, o) => s + (o.realizedPnlUsd == null ? (o.expectedPnlUsd ?? o.pnlUsd ?? 0) : 0),
    0,
  );
  const totalPnlUsd = totalRealizedPnlUsd + totalExpectedPnlUsd;

  let slipBps = 0;
  let slipN = 0;
  let spreadBps = 0;
  let spreadN = 0;
  for (const o of orders) {
    const p = o.payload;
    if (!p) continue;
    const impact = Number(p.totalImpactBps ?? p.marketImpactBps ?? 0);
    if (impact) {
      slipBps += Math.abs(impact);
      slipN++;
    }
    const arb = p.arb as { gapPct?: number } | undefined;
    if (arb?.gapPct) {
      spreadBps += Math.abs(arb.gapPct * 100);
      spreadN++;
    }
  }

  const savedUsd = orders.reduce((s, o) => {
    const bps = Number(o.payload?.totalImpactBps ?? 0);
    const size = o.sizeUsdc ?? 0;
    return s + (bps > 0 ? (size * bps) / 10_000 : 0);
  }, 0);

  const latestPcr = proofs.find((p) => p.pcr0)?.pcr0;

  return {
    volume24h: fmtUsd(vol24),
    openPositions: open.length,
    slippageSaved: fmtUsd(savedUsd),
    proofsPosted: proofs.length,
    portfolioUsd: fmtUsd(deployedNotional || 0),
    deployedNotionalUsd: fmtUsd(deployedNotional || 0),
    totalPnlUsd: fmtUsd(totalPnlUsd),
    totalRealizedPnlUsd: fmtUsd(totalRealizedPnlUsd),
    totalExpectedPnlUsd: fmtUsd(totalExpectedPnlUsd),
    avgSlipBps: slipN ? Math.round(slipBps / slipN) : 0,
    avgSpreadBps: spreadN ? Math.round(spreadBps / spreadN) : 0,
    enclavePcr0: latestPcr,
  };
}

/** Daily volume buckets for charts (last N days) */
export function dailyVolumeSeries(orders: Order[], days = 18): number[] {
  const now = Date.now();
  const dayMs = 86_400_000;
  const buckets = Array.from({ length: days }, () => 0);
  for (const o of orders) {
    const age = now - o.createdAt;
    const idx = days - 1 - Math.floor(age / dayMs);
    if (idx >= 0 && idx < days) buckets[idx] += o.sizeUsdc ?? 0;
  }
  const max = Math.max(...buckets, 1);
  return buckets.map((v) => Math.round((v / max) * 100) || 0);
}

export function slippageSeries(orders: Order[], days = 18): number[] {
  const now = Date.now();
  const dayMs = 86_400_000;
  const buckets = Array.from({ length: days }, () => 0);
  const counts = Array.from({ length: days }, () => 0);
  for (const o of orders) {
    const bps = Number(o.payload?.totalImpactBps ?? 0);
    if (!bps) continue;
    const idx = days - 1 - Math.floor((now - o.createdAt) / dayMs);
    if (idx >= 0 && idx < days) {
      buckets[idx] += bps;
      counts[idx]++;
    }
  }
  return buckets.map((v, i) => (counts[i] ? Math.round(v / counts[i]) : 0));
}
