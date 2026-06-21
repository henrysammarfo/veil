import { describe, it, expect } from "vitest";
import type { Order } from "./types";
import { isActiveOrder, isAwaitingMarketOrder, isSealingOrder } from "./orderStatus";

function mk(partial: Partial<Order>): Order {
  return {
    id: "1",
    intent: "test",
    mode: "BULL",
    state: "SETTLED",
    progress: 100,
    slices: { filled: 1, total: 1 },
    pnl: "+0%",
    asset: "BTC",
    wallet: "0x1",
    createdAt: Date.now(),
    ...partial,
  };
}

describe("orderStatus", () => {
  it("treats SETTLED without realized PnL as active (market open)", () => {
    expect(isAwaitingMarketOrder(mk({ state: "SETTLED" }))).toBe(true);
    expect(isActiveOrder(mk({ state: "SETTLED" }))).toBe(true);
  });

  it("SETTLED with realized PnL is not active", () => {
    const o = mk({ state: "SETTLED", realizedPnlUsd: 5 });
    expect(isActiveOrder(o)).toBe(false);
  });

  it("EXECUTING is sealing", () => {
    expect(isSealingOrder(mk({ state: "EXECUTING", progress: 20 }))).toBe(true);
  });
});
