import type { Order } from "./types";

/** Hide automated smoke-test intents from the cockpit by default. */
export function isSmokeTestOrder(o: Order): boolean {
  const intent = o.intent?.toLowerCase() ?? "";
  return intent.includes("e2e live") || intent.startsWith("smoke ");
}

export function filterUserOrders(orders: Order[], includeSmoke = false): Order[] {
  if (includeSmoke) return orders;
  return orders.filter((o) => !isSmokeTestOrder(o));
}
