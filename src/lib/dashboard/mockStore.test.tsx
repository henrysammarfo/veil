import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MockDataProvider, useMockData } from "@/lib/dashboard/mockStore";

function wrapper({ children }: { children: React.ReactNode }) {
  return <MockDataProvider>{children}</MockDataProvider>;
}

describe("mockStore", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("hydrates seed orders and proofs after the initial shimmer", async () => {
    const { result } = renderHook(() => useMockData(), { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.orders.length).toBeGreaterThan(0);
    expect(result.current.proofs.length).toBeGreaterThan(0);
    expect(result.current.intervals.orders).toBe(4000);
  });

  it("addOrder prepends an order and emits a matching ORDER proof", async () => {
    const { result } = renderHook(() => useMockData(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const before = result.current.orders.length;
    let createdId = "";
    act(() => {
      const o = result.current.addOrder({
        asset: "BTC/USDC",
        mode: "BULL",
        wallet: result.current.wallets[0],
        intent: "Test buy",
        slices: 5,
      });
      createdId = o.id;
    });

    expect(result.current.orders.length).toBe(before + 1);
    expect(result.current.orders[0].id).toBe(createdId);
    expect(result.current.getOrder(createdId)?.intent).toBe("Test buy");
    expect(result.current.proofs[0].tag).toBe("ORDER");
    expect(result.current.proofs[0].orderId).toBe(createdId);
  });

  it("refresh() flips loading and bumps the resource tick", async () => {
    const { result } = renderHook(() => useMockData(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const prevTick = result.current.ticks.orders;
    act(() => result.current.refresh("orders"));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ticks.orders).toBeGreaterThanOrEqual(prevTick);
  });
});
