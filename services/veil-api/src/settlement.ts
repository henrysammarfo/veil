/** Match Predict settled positions → order realized PnL (profit/loss in dUSDC). */

export interface SettlementEvent {
  type: "keeper_redeem" | "position_settled" | "sync";
  oracleId?: string;
  redeemableUsdc: number;
  txDigest?: string;
  orderId?: string;
  timestamp?: number;
}

export interface StoredOrderRow {
  order: Record<string, unknown>;
  execution: Record<string, unknown>;
  trader: string;
  createdAt: number;
}

export function formatRealizedPnl(usd: number, costBasisUsd: number): string {
  if (costBasisUsd <= 0) {
    return usd >= 0 ? `+${usd.toFixed(2)} USD` : `${usd.toFixed(2)} USD`;
  }
  const pct = (usd / costBasisUsd) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function costBasisForOrder(
  input: Record<string, unknown>,
  result: Record<string, unknown>,
): number {
  const mode = String(input.mode ?? "BULL");
  const size = Number(input.sizeUsdc ?? 0);
  if (mode === "EARN") return Number(result.suppliedUsdc ?? size);
  if (mode === "BULL") return Number(result.stakeUsed ?? result.stake ?? size);
  if (mode === "PARLAY") {
    const parlay = result.parlay as { stake?: number } | undefined;
    return Number(parlay?.stake ?? size);
  }
  if (mode === "BEAR") {
    const plan = result.plan as { plpSupply?: number } | undefined;
    return Number(plan?.plpSupply ?? size);
  }
  return size;
}

export function applyRealizedToOrder(
  order: Record<string, unknown>,
  realizedUsd: number,
  meta: { settledAt?: number; settlementTx?: string; source: string },
): Record<string, unknown> {
  const cost = Number(order.costBasisUsd ?? order.sizeUsdc ?? 0);
  const realizedPnl = formatRealizedPnl(realizedUsd, cost);
  const isLoss = realizedUsd < -0.001;
  const isWin = realizedUsd > 0.001;
  return {
    ...order,
    expectedPnl: order.pnl,
    expectedPnlUsd: order.pnlUsd,
    realizedPnlUsd: Math.round(realizedUsd * 100) / 100,
    realizedPnl,
    pnl: realizedPnl,
    pnlUsd: Math.round(realizedUsd * 100) / 100,
    pnlKind: "realized",
    state: "SETTLED",
    progress: 100,
    isProfit: isWin,
    isLoss,
    settledAt: meta.settledAt ?? Date.now(),
    settlementTx: meta.settlementTx,
    settlementSource: meta.source,
  };
}

function orderOracleIds(row: StoredOrderRow): string[] {
  const exec = row.execution;
  const fromExec = exec.oracleIds as string[] | undefined;
  if (fromExec?.length) return fromExec;
  const single = exec.oracleId as string | undefined;
  if (single) return [single];
  return [];
}

function orderHasChainActivity(row: StoredOrderRow): boolean {
  const txs = row.execution.txDigests as (string | null)[] | undefined;
  return Boolean(txs?.some((t) => t && t.length > 8));
}

/** Apply redeemable position values to matching open orders. */
export function syncOrdersWithPositions(
  rows: StoredOrderRow[],
  positions: {
    oracleId: string;
    redeemableUsdc: number;
    status: string;
  }[],
): { updated: number; events: SettlementEvent[] } {
  const events: SettlementEvent[] = [];
  let updated = 0;

  for (const pos of positions) {
    if (pos.redeemableUsdc <= 0 && pos.status !== "settled") continue;

    for (const row of rows) {
      const order = row.order;
      if (order.state === "SETTLED" && order.realizedPnlUsd != null) continue;

      const oracles = orderOracleIds(row);
      const mode = String(order.mode ?? "");
      const matchesOracle = oracles.includes(pos.oracleId) || oracles.length === 0;
      if (!matchesOracle) continue;

      if (mode !== "EARN" && !orderHasChainActivity(row)) continue;

      const cost = Number(order.costBasisUsd ?? order.sizeUsdc ?? 0);
      if (cost <= 0) continue;

      const realizedUsd = pos.redeemableUsdc - cost;
      Object.assign(
        row.order,
        applyRealizedToOrder(row.order, realizedUsd, {
          settledAt: Date.now(),
          source: "predict_position_sync",
        }),
      );
      row.order.matchedOracleId = pos.oracleId;
      events.push({
        type: "position_settled",
        oracleId: pos.oracleId,
        redeemableUsdc: pos.redeemableUsdc,
        orderId: String(order.id),
        timestamp: Date.now(),
      });
      updated++;
      break;
    }
  }

  return { updated, events };
}

export function applyKeeperRedeemEvent(
  rows: StoredOrderRow[],
  event: SettlementEvent,
): boolean {
  if (!event.oracleId || event.redeemableUsdc <= 0) return false;

  for (const row of rows) {
    const order = row.order;
    if (event.orderId && String(order.id) !== event.orderId) continue;
    if (!event.orderId && order.state === "SETTLED" && order.realizedPnlUsd != null) continue;

    const oracles = orderOracleIds(row);
    if (
      event.orderId ||
      oracles.includes(event.oracleId) ||
      oracles.length === 0
    ) {
      const cost = Number(order.costBasisUsd ?? order.sizeUsdc ?? 0);
      if (cost <= 0) continue;
      const realizedUsd = event.redeemableUsdc - cost;
      Object.assign(
        row.order,
        applyRealizedToOrder(row.order, realizedUsd, {
          settledAt: event.timestamp ?? Date.now(),
          settlementTx: event.txDigest,
          source: "keeper_redeem",
        }),
      );
      return true;
    }
  }
  return false;
}
