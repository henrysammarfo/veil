import { describe, it, expect } from "vitest";

// Mirrors the inline filter/sort logic in dashboard.orders.tsx so we can
// assert it stays correct without rendering the whole TanStack route file.
// If you change the route logic, update this helper too.
import type { Order, OrderState } from "@/lib/dashboard/types";

type StatusFilter = "ALL" | "ACTIVE" | OrderState;
type RangeFilter = "ALL" | "24H" | "7D" | "30D";
type SortKey = "NEWEST" | "OLDEST" | "PROGRESS" | "PNL";

const RANGE_MS: Record<RangeFilter, number | null> = {
  ALL: null,
  "24H": 86_400_000,
  "7D": 7 * 86_400_000,
  "30D": 30 * 86_400_000,
};

function parsePnl(p: string): number {
  const m = p.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) * (p.includes("-") ? -1 : 1) : 0;
}

function filterAndSort(
  orders: Order[],
  opts: {
    status: StatusFilter;
    range: RangeFilter;
    wallet: string;
    query: string;
    sort: SortKey;
    now?: number;
  },
): Order[] {
  const now = opts.now ?? Date.now();
  const ms = RANGE_MS[opts.range];
  const q = opts.query.trim().toLowerCase();
  let out = orders.filter((o) => {
    if (opts.status === "ACTIVE" && !(o.state === "EXECUTING" || o.state === "ACCRUING" || (o.state === "SETTLED" && o.realizedPnlUsd == null))) return false;
    if (opts.status !== "ALL" && opts.status !== "ACTIVE" && o.state !== opts.status) return false;
    if (ms && now - o.createdAt > ms) return false;
    if (opts.wallet !== "ALL" && o.wallet !== opts.wallet) return false;
    if (
      q &&
      !(
        o.intent.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.asset.toLowerCase().includes(q)
      )
    )
      return false;
    return true;
  });
  out = [...out].sort((a, b) => {
    switch (opts.sort) {
      case "OLDEST":
        return a.createdAt - b.createdAt;
      case "PROGRESS":
        return b.progress - a.progress;
      case "PNL":
        return parsePnl(b.pnl) - parsePnl(a.pnl);
      default:
        return b.createdAt - a.createdAt;
    }
  });
  return out;
}

function mkOrder(overrides: Partial<Order>): Order {
  return {
    id: "VL-0001",
    intent: "test",
    mode: "BULL",
    state: "EXECUTING",
    progress: 50,
    slices: { filled: 1, total: 2 },
    pnl: "+0.50%",
    asset: "BTC/USDC",
    wallet: "0xaaaa",
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("orders filters + sort", () => {
  const now = 1_700_000_000_000;
  const sample = [
    mkOrder({
      id: "A",
      state: "EXECUTING",
      wallet: "0xaaaa",
      asset: "BTC/USDC",
      pnl: "+1.20%",
      progress: 10,
      createdAt: now - 2 * 3600_000,
    }),
    mkOrder({
      id: "B",
      state: "SETTLED",
      wallet: "0xbbbb",
      asset: "ETH/USDC",
      pnl: "-0.40%",
      progress: 100,
      realizedPnlUsd: -0.4,
      createdAt: now - 2 * 86_400_000,
    }),
    mkOrder({
      id: "C",
      state: "ACCRUING",
      wallet: "0xaaaa",
      asset: "USDC",
      pnl: "+4.10%",
      progress: 42,
      createdAt: now - 10 * 86_400_000,
    }),
  ];

  it("filters by status", () => {
    const r = filterAndSort(sample, {
      status: "EXECUTING",
      range: "ALL",
      wallet: "ALL",
      query: "",
      sort: "NEWEST",
      now,
    });
    expect(r.map((o) => o.id)).toEqual(["A"]);
  });

  it("ACTIVE includes SETTLED awaiting market", () => {
    const r = filterAndSort(
      [
        ...sample,
        mkOrder({ id: "D", state: "SETTLED", progress: 100, createdAt: now - 1000 }),
      ],
      {
        status: "ACTIVE",
        range: "ALL",
        wallet: "ALL",
        query: "",
        sort: "NEWEST",
        now,
      },
    );
    expect(r.map((o) => o.id).sort()).toEqual(["A", "C", "D"]);
  });

  it("filters by 24h range", () => {
    const r = filterAndSort(sample, {
      status: "ALL",
      range: "24H",
      wallet: "ALL",
      query: "",
      sort: "NEWEST",
      now,
    });
    expect(r.map((o) => o.id)).toEqual(["A"]);
  });

  it("filters by wallet", () => {
    const r = filterAndSort(sample, {
      status: "ALL",
      range: "ALL",
      wallet: "0xaaaa",
      query: "",
      sort: "NEWEST",
      now,
    });
    expect(r.map((o) => o.id).sort()).toEqual(["A", "C"]);
  });

  it("filters by free-text query against asset", () => {
    const r = filterAndSort(sample, {
      status: "ALL",
      range: "ALL",
      wallet: "ALL",
      query: "eth",
      sort: "NEWEST",
      now,
    });
    expect(r.map((o) => o.id)).toEqual(["B"]);
  });

  it("sorts by PNL desc", () => {
    const r = filterAndSort(sample, {
      status: "ALL",
      range: "ALL",
      wallet: "ALL",
      query: "",
      sort: "PNL",
      now,
    });
    expect(r.map((o) => o.id)).toEqual(["C", "A", "B"]);
  });

  it("sorts by progress desc", () => {
    const r = filterAndSort(sample, {
      status: "ALL",
      range: "ALL",
      wallet: "ALL",
      query: "",
      sort: "PROGRESS",
      now,
    });
    expect(r.map((o) => o.id)).toEqual(["B", "C", "A"]);
  });

  it("returns empty when no orders match", () => {
    const r = filterAndSort(sample, {
      status: "PENDING",
      range: "ALL",
      wallet: "ALL",
      query: "",
      sort: "NEWEST",
      now,
    });
    expect(r).toEqual([]);
  });
});
