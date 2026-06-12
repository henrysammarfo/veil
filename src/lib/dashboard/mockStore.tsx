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
 */

export const INTERVALS = {
  orders: 4000,
  proofs: 6000,
  archive: 60000,
} as const;

export type ResourceKey = keyof typeof INTERVALS;

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
  wallet: string; // origin wallet (mock)
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
  pcr0?: string;
  enclave?: string;
  txDigest?: string;
  payload?: Record<string, unknown>;
  createdAt: number;
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
  ticks: Record<ResourceKey, number>;
  intervals: typeof INTERVALS;
  refresh: (key?: ResourceKey) => void;
  getProof: (id: string) => Proof | undefined;
  getOrder: (id: string) => Order | undefined;
  wallets: string[];
}

const Ctx = createContext<MockData | null>(null);

const WALLETS = [
  "0x4f29…ab12",
  "0x9b71…ee03",
  "0x2c44…7710",
];

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
    wallet: WALLETS[0],
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
    wallet: WALLETS[0],
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
    wallet: WALLETS[1],
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
    wallet: WALLETS[2],
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
];

function mkProof(p: Omit<Proof, "createdAt">): Proof {
  return { createdAt: Date.now(), ...p };
}

const SEED_PROOFS: Proof[] = [
  mkProof({ id: "p1", t: "16:44:41", tag: "ATTEST", text: "PCR0 verified · enclave veil-bull-v1.3", hash: "0x8c2fa91dabc1290e09a8c3e9b7", orderId: "VL-0142", enclave: "veil-bull-v1.3", pcr0: "0x8c2fa91d2bc1290e09a8c3e9b7115a8e3a9b7c102", txDigest: "Sui:0xa1b2c3d4e5f6", payload: { slice: 7, market: "BTC/USDC", spreadBps: 6 } }),
  mkProof({ id: "p2", t: "16:44:38", tag: "SETTLE", text: "VL-0142 slice 7/11 filled @ $67,184 — Δslip −0.04%", hash: "0x7711bb02e9c43b1abf09112a1c", orderId: "VL-0142", payload: { slice: 7, price: 67184, slipBps: -4 } }),
  mkProof({ id: "p3", t: "16:42:12", tag: "ROUTE",  text: "Cetus pool 0x9a…11 · depth $214k · spread 6bps", hash: "0x9a11ee23010fc4b89a012bb7c0", payload: { pool: "0x9a11", depthUsd: 214000, spreadBps: 6 } }),
  mkProof({ id: "p4", t: "16:41:50", tag: "ATTEST", text: "PCR0 verified · enclave veil-router-v0.9", hash: "0x71a044ce3c5f0a290110ab39f1", enclave: "veil-router-v0.9", pcr0: "0x71a044ce3c5f0a290110ab39f120ac8810b8f3110" }),
  mkProof({ id: "p5", t: "16:39:02", tag: "ORDER",  text: "Intent VL-0143 admitted · BTC up 7d · k=11", hash: "0x44cca10202bb3998810c411a8e", orderId: "VL-0143", payload: { k: 11, horizonDays: 7 } }),
  mkProof({ id: "p6", t: "16:32:18", tag: "ATTEST", text: "PCR0 verified · enclave veil-bear-v1.1", hash: "0x55b10fa2c011009d3eaa3a8d72", enclave: "veil-bear-v1.1", pcr0: "0x55b10fa2c011009d3eaa3a8d720b9c1eeff0a0091" }),
  mkProof({ id: "p7", t: "16:28:00", tag: "SETTLE", text: "VL-0141 closed · realized +0.82%", hash: "0xae09331cb20990a112002fd14e", orderId: "VL-0141", payload: { realizedPct: 0.82 } }),
  mkProof({ id: "p8", t: "16:14:44", tag: "WALRUS", text: "Daily report sealed → walrus.site/veil/2026-06-11", hash: "0x9d4c77a10122ff90bba112c3e8", payload: { date: "2026-06-11", proofs: 27, sizeBytes: 1_468_006 } }),
];

const SEED_ARCHIVE: ArchiveEntry[] = [
  { date: "2026-06-11", hash: "0x9d4c…77a1", size: "1.4 MB", proofs: 27, url: "https://walrus.site/veil/2026-06-11" },
  { date: "2026-06-10", hash: "0x71f0…b220", size: "1.9 MB", proofs: 31, url: "https://walrus.site/veil/2026-06-10" },
  { date: "2026-06-09", hash: "0x402a…ee18", size: "0.8 MB", proofs: 14, url: "https://walrus.site/veil/2026-06-09" },
  { date: "2026-06-08", hash: "0x18bc…d490", size: "1.1 MB", proofs: 19, url: "https://walrus.site/veil/2026-06-08" },
  { date: "2026-06-07", hash: "0xc041…22f8", size: "0.6 MB", proofs: 9, url: "https://walrus.site/veil/2026-06-07" },
];

const PROOF_TEMPLATES: Array<Omit<Proof, "id" | "t" | "createdAt">> = [
  { tag: "ATTEST", text: "PCR0 re-verified · enclave veil-bull-v1.3", hash: "0x8c2fa91d10ab39c021b9c01ee0", enclave: "veil-bull-v1.3" },
  { tag: "ROUTE",  text: "Cetus pool routed · spread 5bps · depth $198k", hash: "0x9a11ee4402ab3819cc09812abe", payload: { spreadBps: 5, depthUsd: 198000 } },
  { tag: "SETTLE", text: "VL-0142 slice filled · Δslip −0.03%", hash: "0x77ffcc12bba01099012ab33910", orderId: "VL-0142", payload: { slipBps: -3 } },
  { tag: "ORDER",  text: "Intent admitted · ETH range-sell · 14d", hash: "0x33aa11023baf9aa3c012ee9a87" },
  { tag: "ATTEST", text: "PCR0 verified · enclave veil-router-v0.9", hash: "0x71a044cebb091ab23ee0192cab", enclave: "veil-router-v0.9" },
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
  const [ticks, setTicks] = useState<Record<ResourceKey, number>>({
    orders: Date.now(),
    proofs: Date.now(),
    archive: Date.now(),
  });
  const stamp = useRef(0);

  // Initial load shimmer — feels like a real API hit.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, []);

  // Orders tick
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.state !== "EXECUTING") return o;
          const next = Math.min(100, o.progress + Math.random() * 3);
          const filled = Math.min(o.slices.total, Math.floor((next / 100) * o.slices.total));
          return {
            ...o,
            progress: next,
            slices: { ...o.slices, filled },
            state: next >= 100 ? "SETTLED" : "EXECUTING",
          };
        }),
      );
      setTicks((t) => ({ ...t, orders: Date.now() }));
    }, INTERVALS.orders);
    return () => clearInterval(id);
  }, [loading]);

  // Proofs tick
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => {
      const tpl = PROOF_TEMPLATES[Math.floor(Math.random() * PROOF_TEMPLATES.length)];
      stamp.current += 1;
      const next: Proof = {
        ...tpl,
        id: `p-live-${stamp.current}-${Date.now()}`,
        t: nowClock(),
        createdAt: Date.now(),
      };
      setProofs((prev) => [next, ...prev].slice(0, 80));
      setTicks((t) => ({ ...t, proofs: Date.now() }));
    }, INTERVALS.proofs);
    return () => clearInterval(id);
  }, [loading]);

  // Archive tick (counter only, archive stays static in mock)
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => setTicks((t) => ({ ...t, archive: Date.now() })), INTERVALS.archive);
    return () => clearInterval(id);
  }, [loading]);

  const refresh = useCallback((key?: ResourceKey) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const now = Date.now();
      if (key) setTicks((t) => ({ ...t, [key]: now }));
      else setTicks({ orders: now, proofs: now, archive: now });
    }, 450);
  }, []);

  const getProof = useCallback((id: string) => proofs.find((p) => p.id === id), [proofs]);
  const getOrder = useCallback((id: string) => orders.find((o) => o.id === id), [orders]);

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

  const lastTick = Math.max(ticks.orders, ticks.proofs, ticks.archive);

  const value: MockData = {
    orders,
    proofs,
    archive,
    stats,
    loading,
    lastTick,
    ticks,
    intervals: INTERVALS,
    refresh,
    getProof,
    getOrder,
    wallets: WALLETS,
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
