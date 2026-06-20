import type { SliceSpec } from "../slices.js";
import { computeVwap, generateSliceSchedule } from "../slices.js";
import { kellySize } from "../kelly.js";
import { sviBackSolve, type SviParams } from "../svi.js";

export type VeilMode = "BULL" | "BEAR" | "EARN" | "PARLAY";

export interface VeilOrder {
  direction: "LONG" | "SHORT";
  asset: string;
  sizeUsdc: number;
  timeHorizonHours: number;
  userConvictionPct: number;
  maxSlippageBps: number;
  mode: VeilMode;
  strike?: number;
  forward?: number;
  /** When set, enclave may submit one live Predict mint (signed-in user only). */
  traderAddress?: string;
}

export interface FillRecord {
  sliceNumber: number;
  price: number;
  size: number;
  timestamp: number;
}

export interface ExecutionSummary {
  fills: FillRecord[];
  vwap: number;
  totalImpactBps: number;
  stakeUsed: number;
  sliceCount: number;
}

export interface MintExecutor {
  mint(slice: SliceSpec, order: VeilOrder): Promise<FillRecord>;
}

export interface BullModeInput {
  order: VeilOrder;
  balance: number;
  svi: SviParams;
  strike: number;
  forward: number;
  oddsMultiplier?: number;
  numSlices?: number;
  currentVol?: number;
}

export async function planBullExecution(input: BullModeInput): Promise<{
  impliedProb: number;
  stake: number;
  schedule: SliceSpec[];
}> {
  const {
    order,
    balance,
    svi,
    strike,
    forward,
    oddsMultiplier = 0.92,
    numSlices = 10,
    currentVol = svi.sigma,
  } = input;
  const timeYears = order.timeHorizonHours / (24 * 365);
  const impliedProb = sviBackSolve(svi, strike, forward, timeYears);
  const conviction = order.userConvictionPct / 100;
  const stake = kellySize(conviction, impliedProb, balance, oddsMultiplier, order.sizeUsdc);
  const schedule = generateSliceSchedule({
    totalSize: stake,
    numSlices,
    currentVol,
  });
  return { impliedProb, stake, schedule };
}

export async function executeBullMode(
  order: VeilOrder,
  schedule: SliceSpec[],
  executor: MintExecutor,
): Promise<ExecutionSummary> {
  const fills: FillRecord[] = [];
  for (const slice of schedule) {
    const fill = await executor.mint(slice, order);
    fills.push(fill);
  }
  const { vwap, totalImpactBps } = computeVwap(
    fills.map((f) => ({ price: f.price, size: f.size })),
  );
  const stakeUsed = fills.reduce((s, f) => s + f.size, 0);
  return {
    fills,
    vwap,
    totalImpactBps,
    stakeUsed,
    sliceCount: fills.length,
  };
}
