export const INTERVALS = {
  orders: 8000,
  proofs: 12000,
  archive: 60000,
} as const;

export type ResourceKey = keyof typeof INTERVALS;

export type OrderMode = "BULL" | "BEAR" | "EARN" | "PARLAY";
export type OrderState = "EXECUTING" | "SETTLED" | "ACCRUING" | "PENDING";

export interface Order {
  id: string;
  intent: string;
  mode: OrderMode;
  state: OrderState;
  progress: number;
  slices: { filled: number; total: number };
  pnl: string;
  pnlUsd?: number;
  pnlKind?: "realized" | "expected" | "neutral";
  expectedPnl?: string;
  expectedPnlUsd?: number;
  realizedPnl?: string;
  realizedPnlUsd?: number;
  costBasisUsd?: number;
  stealth?: boolean;
  isProfit?: boolean;
  isLoss?: boolean;
  settledAt?: number;
  settlementTx?: string;
  asset: string;
  wallet: string;
  createdAt: number;
  sizeUsdc?: number;
  attestationHash?: string;
  enclaveId?: string;
  reportUrl?: string;
  /** Full enclave execution response for detail JSON preview */
  payload?: Record<string, unknown>;
}

export type ProofTag = "ATTEST" | "SETTLE" | "ROUTE" | "ORDER" | "WALRUS" | "ERROR";

export interface Proof {
  id: string;
  t: string;
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
  deployedNotionalUsd?: string;
  totalPnlUsd?: string;
  totalRealizedPnlUsd?: string;
  totalExpectedPnlUsd?: string;
  /** Pro-only aggregates */
  avgSpreadBps?: number;
  avgSlipBps?: number;
  enclavePcr0?: string;
}

export interface VeilDashboardData {
  orders: Order[];
  proofs: Proof[];
  archive: ArchiveEntry[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  lastTick: number;
  ticks: Record<ResourceKey, number>;
  intervals: typeof INTERVALS;
  refresh: (key?: ResourceKey) => Promise<void>;
  getProof: (id: string) => Proof | undefined;
  getOrder: (id: string) => Order | undefined;
  wallets: string[];
  placeOrder: (input: {
    asset: string;
    mode: OrderMode;
    wallet: string;
    intent: string;
    sizeUsdc: number;
    timeHorizonHours: number;
    direction: "LONG" | "SHORT";
    userConvictionPct?: number;
  }) => Promise<Order>;
}
