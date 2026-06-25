import type { Order, Proof, ArchiveEntry } from "@/lib/dashboard/types";
import { VEIL_CONFIG } from "./config";

export type VeilMode = "BULL" | "BEAR" | "EARN" | "PARLAY";
export type PlaceOrderInput = {
  direction: "LONG" | "SHORT";
  asset: string;
  sizeUsdc: number;
  timeHorizonHours: number;
  userConvictionPct: number;
  maxSlippageBps: number;
  mode: VeilMode;
  strike?: number;
  intent?: string;
  trader?: string;
  traderAddress?: string;
  managerId?: string;
};

export interface ExecuteOrderResult {
  executionId: string;
  mode: string;
  vwap?: number;
  totalImpactBps?: number;
  totalFills?: number;
  sliceCount?: number;
  attestationPayload?: string;
  attestationHash?: string;
  reportUrl?: string;
  enclaveId?: string;
  txDigests?: string[];
  simulation?: unknown;
  parlay?: unknown;
  parlayRecordParams?: {
    convictionBps: number;
    marketProbBps: number;
    correlationBps: number;
    legCount: number;
  };
  onChainAttestation?: {
    digest: string;
    signature: string;
    publicKey: string;
    mode: number;
    vwap: number;
    impactBps: number;
    fills: number;
    blobId: string;
    enclaveId: string;
  };
  proofObjectDigest?: string;
  arb?: { arbDetected: boolean; gapPct: number };
  order?: Order;
}

export async function syncSettlement(managerId?: string): Promise<{ updated: number }> {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/settlement/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(managerId ? { managerId } : {}),
  });
  if (!res.ok) return { updated: 0 };
  return res.json() as Promise<{ updated: number }>;
}

export async function placeOrder(input: PlaceOrderInput): Promise<ExecuteOrderResult> {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Veil execute failed: ${res.status} ${text}`);
  }
  return (await res.json()) as ExecuteOrderResult;
}

/** @deprecated use placeOrder */
export const executeOrder = placeOrder;

export async function fetchOrders(trader: string): Promise<Order[]> {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/orders?trader=${encodeURIComponent(trader)}`);
  if (!res.ok) throw new Error(`Orders fetch failed: ${res.status}`);
  return (await res.json()) as Order[];
}

export async function fetchOrderDetail(
  trader: string,
  orderId: string,
): Promise<{ order: Order; execution: Record<string, unknown> } | null> {
  const res = await fetch(
    `${VEIL_CONFIG.apiUrl}/api/orders/${encodeURIComponent(orderId)}?trader=${encodeURIComponent(trader)}`,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Order fetch failed: ${res.status}`);
  return (await res.json()) as { order: Order; execution: Record<string, unknown> };
}

export async function fetchProofs(trader: string, orderId?: string): Promise<Proof[]> {
  const q = new URLSearchParams({ trader });
  if (orderId) q.set("orderId", orderId);
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/proofs?${q}`);
  if (!res.ok) throw new Error(`Proofs fetch failed: ${res.status}`);
  return (await res.json()) as Proof[];
}

export async function fetchArchive(trader: string): Promise<ArchiveEntry[]> {
  const res = await fetch(
    `${VEIL_CONFIG.apiUrl}/api/archive?trader=${encodeURIComponent(trader)}`,
  );
  if (!res.ok) return [];
  return (await res.json()) as ArchiveEntry[];
}

export async function fetchSvi() {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/oracle/svi`);
  if (!res.ok) return null;
  const data = (await res.json()) as { svi: Record<string, number> | null };
  return data.svi;
}

export async function fetchArb(asset: string, strike: number) {
  const url = `${VEIL_CONFIG.apiUrl}/api/arb?asset=${asset}&strike=${strike}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchLeaders(range: "1H" | "6H" | "24H" = "6H") {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/leaders?range=${range}`);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    leaders: {
      addr: string;
      shortAddr: string;
      closed: number;
      winrate: number;
      pnl: string;
      vol: string;
    }[];
  };
  return data.leaders;
}

export async function fetchTraderProfile(addr: string) {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/traders/${encodeURIComponent(addr)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Trader fetch failed: ${res.status}`);
  return res.json() as Promise<{
    addr: string;
    shortAddr: string;
    closed: number;
    winrate: number;
    pnl: string;
    vol: string;
    orders: Order[];
  }>;
}
export async function verifyAttestation(hash: string): Promise<boolean> {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attestationHash: hash }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { valid: boolean };
  return data.valid;
}

/** Enoki sponsored tx — step 1: create (backend uses ENOKI_SECRET_KEY). */
export async function createSponsoredTransaction(input: {
  jwt: string;
  transactionKindBytes: string;
  network?: "testnet" | "devnet";
}) {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/sponsor/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Sponsor create failed: ${res.status}`);
  return res.json() as Promise<{ bytes: string; digest: string }>;
}

/** Enoki sponsored tx — step 2: execute after user signs bytes. */
export async function executeSponsoredTransaction(input: { digest: string; signature: string }) {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/sponsor/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Sponsor execute failed: ${res.status}`);
  return res.json() as Promise<{ digest: string; quota?: { used: number; max: number; remaining: number } }>;
}
