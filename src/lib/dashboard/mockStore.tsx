import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Central mock data source for the Veil cockpit.
 *
 * All dashboard widgets read from here so the cockpit feels alive and
 * stays in sync. Swap each loader for a real Sui/Walrus call without
 * touching components — every consumer reads the same shape.
 *
 * Refresh cadence (mock):
 *   orders  → every 4s (slice progress ticks)
 *   proofs  → every 6s (a new line appears at the top)
 *   archive → every 60s (daily report, slow)
 *   stats   → every 8s
 */

export type OrderMode = "BULL" | "BEAR" | "EARN";
export type OrderState = "EXECUTING" | "SETTLED" | "ACCRUING" | "PENDING";

export interface Order {
  id: string;
  intent: string;
  mode: OrderMode;
  state: OrderState;
  progress: number; // 0..100
  slices: { filled: number; total: number };
  pnl: string;
  asset: string;
  createdAt: number;
}

export type ProofTag = "ATTEST" | "SETTLE" | "ROUTE" | "ORDER" | "WALRUS" | "ERROR";

export interface Proof {
  id: string;
  t: string; // HH:MM:SS
  tag: ProofTag;
  text: string;
  hash: string;
  orderId?: string;
}

export interface ArchiveEntry {
  date: string;
  hash: string;
  size: string;
  proofs: number;
  url: string;
}

export interface DashboardStats {
  volume24h: string;
  openPositions: number;
  slippageSaved: string;
  proofsPosted: number;
  portfolioUsd: string;
}

interface MockData {
  orders: Order[];
  proofs: Proof[];
  archive: ArchiveEntry[];
  stats: DashboardStats;
  loading: boolean;
  lastTick: number;
  refresh: () => void;
}

const Ctx = createContext<MockData | null>(null);

const SEED_ORDERS: Order[] = [
  {
    id: "VL-0142",
    intent: "Accumulate BTC over 7 days · $50k notional",
    mode: "BULL",
    state: "EXECUTING",
    progress: 64,
    slices: { filled: 7, total: 11 },
    pnl: "+1.24%",
    asset: "BTC/USDC",
    createdAt: Date.now() - 1000 * 60 * 60 * 9,
  },
  {
    id: "VL-0141",
    intent: "Range-sell ETH over 14 days · $20k",
    mode: "BEAR",
    state: "SETTLED",
    progress: 100,
    slices: { filled: 9, total: 9 },
    pnl: "+0.82%",
    asset: "ETH/USDC",
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
  },
  {
    id: "VL-0140",
    intent: "Auto-compound PLP · USDC vault",
    mode: "EARN",
    state: "ACCRUING",
    progress: 42,
    slices: { filled: 18, total: 30 },
    pnl: "+4.1% APR",
    asset: "USDC",
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
  },
  {
    id: "VL-0139",
    intent: "Stealth buy SUI · 3 days · $8k",
    mode: "BULL",
    state: "EXECUTING",
    progress: 22,
    slices: { filled: 2, total: 9 },
    pnl: "+0.31%",
    asset: "SUI/USDC",
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
];

const SEED_PROOFS: Proof[] = [
  { id: "p1", t: "16:44:41", tag: "ATTEST", text: "PCR0 verified · enclave veil-bull-v1.3", hash: "0x8c2fa91d", orderId: "VL-0142" },
  { id: "p2", t: "16:44:38", tag: "SETTLE", text: "VL-0142 slice 7/11 filled @ $67,184 — Δslip −0.04%", hash: "0x7711bb02", orderId: "VL-0142" },
  { id: "p3", t: "16:42:12", tag: "ROUTE",  text: "Cetus pool 0x9a…11 · depth $214k · spread 6bps", hash: "0x9a11ee23" },
  { id: "p4", t: "16:41:50", tag: "ATTEST", text: "PCR0 verified · enclave veil-router-v0.9", hash: "0x71a044ce" },
  { id: "p5", t: "16:39:02", tag: "ORDER",  text: "Intent VL-0143 admitted · BTC up 7d · k=11", hash: "0x44cca102", orderId: "VL-0143" },
  { id: "p6", t: "16:32:18", tag: "ATTEST", text: "PCR0 verified · enclave veil-bear-v1.1", hash: "0x55b10fa2" },
  { id: "p7", t: "16:28:00", tag: "SETTLE", text: "VL-0141 closed · realized +0.82%", hash: "0xae09331c", orderId: "VL-0141" },
  { id: "p8", t: "16:14:44", tag: "WALRUS", text: "Daily report sealed → walrus.site/veil/2026-06-11", hash: "0x9d4c77a1" },
];

const SEED_ARCHIVE: ArchiveEntry[] = [
  { date: "2026-06-11", hash: "0x9d4c…77a1", size: "1.4 MB", proofs: 27, url: "https://walrus.site/veil/2026-06-11" },
  { date: "2026-06-10", hash: "0x71f0…b220", size: "1.9 MB", proofs: 31, url: "https://walrus.site/veil/2026-06-10" },
  { date: "2026-06-09", hash: "0x402a…ee18", size: "0.8 MB", proofs: 14, url: "https://walrus.site/veil/2026-06-09" },
  { date: "2026-06-08", hash: "0x18bc…d490", size: "1.1 MB", proofs: 19, url: "https://walrus.site/veil/2026-06-08" },
  { date: "2026-06-07", hash: "0xc041…22f8", size: "0.6 MB", proofs: 9, url: "https://walrus.site/veil/2026-06-07" },
];

const PROOF_TEMPLATES: Array<Omit<Proof, "id" | "t">> = [
  { tag: "ATTEST", text: "PCR0 re-verified · enclave veil-bull-v1.3", hash: "0x8c2fa91d" },
  { tag: "ROUTE",  text: "Cetus pool routed · spread 5bps · depth $198k", hash: "0x9a11ee44" },
  { tag: "SETTLE", text: "VL-0142 slice filled · Δslip −0.03%", hash: "0x77ffcc12", orderId: "VL-0142" },
  { tag: "ORDER",  text: "Intent admitted · ETH range-sell · 14d", hash: "0x33aa1102" },
  { tag: "ATTEST", text: "PCR0 verified · enclave veil-router-v0.9", hash: "0x71a044ce" },
];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function nowClock(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [proofs, setProofs] = useState<Proof[]>(SEED_PROOFS);
  const [archive] = useState<ArchiveEntry[]>(SEED_ARCHIVE);
  const [loading, setLoading] = useState(true);
  const [lastTick, setLastTick] = useState(Date.now());
  const stamp = useRef(0);

  // Initial load shimmer — feels like a real API hit.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, []);

  // Orders: nudge progress every 4s
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.state !== "EXECUTING") return o;
          const next = Math.min(100, o.progress + Math.random() * 3);
          const filled = Math.min(
            o.slices.total,
            Math.floor((next / 100) * o.slices.total),
          );
          return {
            ...o,
            progress: next,
            slices: { ...o.slices, filled },
            state: next >= 100 ? "SETTLED" : "EXECUTING",
          };
        }),
      );
      setLastTick(Date.now());
    }, 4000);
    return () => clearInterval(id);
  }, [loading]);

  // Proofs: prepend a new line every 6s
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => {
      const tpl = PROOF_TEMPLATES[Math.floor(Math.random() * PROOF_TEMPLATES.length)];
      stamp.current += 1;
      const next: Proof = { ...tpl, id: `p-live-${stamp.current}-${Date.now()}`, t: nowClock() };
      setProofs((prev) => [next, ...prev].slice(0, 50));
    }, 6000);
    return () => clearInterval(id);
  }, [loading]);

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, []);

  const stats: DashboardStats = useMemo(() => {
    const open = orders.filter((o) => o.state === "EXECUTING" || o.state === "ACCRUING").length;
    return {
      volume24h: "$48,210",
      openPositions: open,
      slippageSaved: "$1,842",
      proofsPosted: proofs.length,
      portfolioUsd: "$10,000.00",
    };
  }, [orders, proofs.length]);

  const value: MockData = {
    orders,
    proofs,
    archive,
    stats,
    loading,
    lastTick,
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMockData(): MockData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMockData must be used inside <MockDataProvider>");
  return v;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}
