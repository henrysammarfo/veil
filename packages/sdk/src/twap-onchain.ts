/** Full on-chain TWAP — one Predict mint tx per slice, live oracle price per fill. */
import type { SliceSpec } from "../../execution-engine/src/slices.js";
import { computeVwap } from "../../execution-engine/src/slices.js";
import type { ExecutionSummary, FillRecord, VeilOrder } from "../../execution-engine/src/modes/bull.js";
import { fetchOracleForward, predictPriceToUsd } from "./predict-market.js";
import { mintOnce } from "./enclave-chain.js";
import type { PredictExecutor } from "./predict-executor.js";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function sliceQuantityFromUsdc(sizeUsdc: number): number {
  const usdcPerUnit = Number(process.env.TWAP_QUANTITY_USDC_PER_UNIT ?? "5");
  return Math.max(1, Math.min(20, Math.round(sizeUsdc / usdcPerUnit)));
}

export interface TwapOnChainResult {
  summary: ExecutionSummary;
  txDigests: string[];
  onChain: true;
}

/** Execute every TWAP slice as a separate on-chain Predict mint — no simulated fills. */
export async function executeBullTwapOnChain(
  executor: PredictExecutor,
  opts: {
    order: VeilOrder;
    schedule: SliceSpec[];
    managerId: string;
    oracleId: string;
    strikeUsd: number;
  },
): Promise<TwapOnChainResult> {
  const fills: FillRecord[] = [];
  const txDigests: string[] = [];
  const maxSlices = Number(process.env.TWAP_MAX_SLICES ?? "5");
  // Min gap so PredictManager object version is fresh between mints (Sui concurrency).
  const sliceDelayMs = Number(process.env.TWAP_SLICE_DELAY_MS ?? "2500");
  const useScheduleDelays = process.env.TWAP_USE_SCHEDULE_DELAYS === "true";
  const schedule = opts.schedule.slice(0, maxSlices);

  for (let i = 0; i < schedule.length; i++) {
    const slice = schedule[i]!;
    if (i > 0) {
      const waitMs = useScheduleDelays
        ? Math.max(0, Math.round(slice.delayMs + slice.jitterMs))
        : sliceDelayMs;
      if (waitMs > 0) await sleep(waitMs);
    }

    const forwardRaw = await fetchOracleForward(opts.oracleId);
    const price = forwardRaw != null ? predictPriceToUsd(forwardRaw) : opts.strikeUsd;

    try {
      const digest = await mintOnce(executor, {
        managerId: opts.managerId,
        oracleId: opts.oracleId,
        strikeUsd: opts.strikeUsd,
        isUp: opts.order.direction === "LONG",
        quantity: sliceQuantityFromUsdc(slice.size),
      });
      txDigests.push(digest);
      fills.push({
        sliceNumber: slice.sliceNumber,
        price,
        size: slice.size,
        timestamp: Date.now(),
        txDigest: digest,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`twap slice ${slice.sliceNumber} mint failed:`, msg);
      if (msg.includes("unavailable for consumption") || msg.includes("version")) {
        await sleep(Math.max(sliceDelayMs, 4000));
        try {
          const digest = await mintOnce(executor, {
            managerId: opts.managerId,
            oracleId: opts.oracleId,
            strikeUsd: opts.strikeUsd,
            isUp: opts.order.direction === "LONG",
            quantity: sliceQuantityFromUsdc(slice.size),
          });
          txDigests.push(digest);
          fills.push({
            sliceNumber: slice.sliceNumber,
            price,
            size: slice.size,
            timestamp: Date.now(),
            txDigest: digest,
          });
        } catch (retryErr) {
          console.warn(
            `twap slice ${slice.sliceNumber} retry failed:`,
            retryErr instanceof Error ? retryErr.message : retryErr,
          );
        }
      }
    }
  }

  if (fills.length === 0) {
    throw new Error("TWAP failed: no on-chain fills (check manager balance and oracle)");
  }

  const { vwap, totalImpactBps } = computeVwap(fills.map((f) => ({ price: f.price, size: f.size })));
  const stakeUsed = fills.reduce((s, f) => s + f.size, 0);

  return {
    onChain: true,
    txDigests,
    summary: {
      fills,
      vwap,
      totalImpactBps,
      stakeUsed,
      sliceCount: fills.length,
    },
  };
}

/** Plan-only path when user is not signed in — zero fills, no simulation. */
export function bullPlanOnlySummary(stake: number, forwardUsd: number): ExecutionSummary {
  return {
    fills: [],
    vwap: forwardUsd,
    totalImpactBps: 0,
    stakeUsed: stake,
    sliceCount: 0,
  };
}
