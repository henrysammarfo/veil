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

/** Anything still "live" from the trader's perspective (not fully closed out). */
export function isActiveOrder(o: Order): boolean {
  return isSealingOrder(o) || isAccruingOrder(o) || isAwaitingMarketOrder(o);
}

export function activeOrderSubLabel(o: Order): string {
  if (isSealingOrder(o)) return "Sealing slices in enclave";
  if (isAccruingOrder(o)) return "Earning · PLP supply active";
  if (isAwaitingMarketOrder(o)) return "Awaiting market · redeem on Portfolio";
  return "";
}
