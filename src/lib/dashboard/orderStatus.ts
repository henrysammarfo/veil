import type { Order } from "./types";

/** Enclave still sealing slices (or queued). */
export function isSealingOrder(o: Order): boolean {
  return o.state === "EXECUTING" || o.state === "PENDING";
}

/** EARN mode — dUSDC supplied to PLP, yield accruing. */
export function isAccruingOrder(o: Order): boolean {
  return o.state === "ACCRUING";
}

/** Slices done; Predict market still open until horizon + oracle settle. */
export function isAwaitingMarketOrder(o: Order): boolean {
  return o.state === "SETTLED" && o.realizedPnlUsd == null;
}

/** Predict market closed — realized PnL recorded. */
export function isClosedWithRealizedPnl(o: Order): boolean {
  return o.realizedPnlUsd != null;
}

/** Anything still "live" from the trader's perspective (not fully closed out). */
export function isActiveOrder(o: Order): boolean {
  return isSealingOrder(o) || isAccruingOrder(o) || isAwaitingMarketOrder(o);
}

export function marketPhaseLabel(o: Order): string {
  if (isClosedWithRealizedPnl(o)) return "Market closed";
  if (isAwaitingMarketOrder(o)) return "Awaiting market";
  if (isSealingOrder(o)) return "Sealing";
  if (isAccruingOrder(o)) return "Earning";
  return o.state;
}

export function activeOrderSubLabel(o: Order): string {
  if (isSealingOrder(o)) return "Sealing slices in enclave";
  if (isAccruingOrder(o)) return "Earning · PLP supply active";
  if (isAwaitingMarketOrder(o)) return "Awaiting market · redeem on Portfolio";
  return "";
}
