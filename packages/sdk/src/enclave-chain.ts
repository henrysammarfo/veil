/** On-chain Predict ops for enclave — mint, earn supply, bear vault */
import { buildMintPtb } from "./predict-ptb.js";
import type { PredictExecutor } from "./predict-executor.js";
import {
  clampEarnSupplyUsdc,
  supplyIdleToPlp,
  type EarnSupplyParams,
} from "./predict-earn.js";
import {
  fetchActiveOracle,
  resolveMintStrike,
  usdToPredictStrike,
  type LiveMarketContext,
} from "./predict-market.js";
import {
  MANAGER_MINT_RESERVE_USDC,
  MAX_EARN_SUPPLY_USDC,
  MIN_EARN_SUPPLY_USDC,
} from "./constants.js";

export interface MintOnceParams {
  managerId: string;
  oracleId: string;
  strikeUsd: number;
  isUp: boolean;
  quantity?: number;
}

export async function mintOnce(
  executor: PredictExecutor,
  params: MintOnceParams,
): Promise<string> {
  const mintKey = await resolveMintStrike(params.oracleId, params.strikeUsd);
  if (!mintKey) throw new Error("oracle inactive");
  const tx = buildMintPtb({
    managerId: params.managerId,
    oracleId: params.oracleId,
    expiry: mintKey.expiry,
    strike: mintKey.strike,
    isUp: params.isUp,
    quantity: params.quantity ?? 1,
  });
  return executor.execute(tx);
}

export async function earnSupplyIdle(
  executor: PredictExecutor,
  managerId: string,
  recipient: string,
  targetUsdc?: number,
): Promise<{ digest: string | null; suppliedUsdc: number }> {
  const amount = targetUsdc
    ? await clampEarnSupplyUsdc(managerId, targetUsdc)
    : await clampEarnSupplyUsdc(managerId, MIN_EARN_SUPPLY_USDC);
  if (amount <= 0) return { digest: null, suppliedUsdc: 0 };
  const digest = await supplyIdleToPlp(executor, {
    managerId,
    recipient,
    amountUsdc: amount,
    reserveUsdc: MANAGER_MINT_RESERVE_USDC,
  });
  return { digest, suppliedUsdc: amount };
}

export async function bearVaultOnChain(
  executor: PredictExecutor,
  opts: {
    managerId: string;
    oracleId: string;
    recipient: string;
    sizeUsdc: number;
    forwardUsd: number;
  },
): Promise<{ txDigests: string[]; plpSupplyUsdc: number }> {
  const digests: string[] = [];
  const plpTarget = await clampEarnSupplyUsdc(
    opts.managerId,
    Math.min(opts.sizeUsdc * 0.15, MAX_EARN_SUPPLY_USDC),
  );
  if (plpTarget >= MIN_EARN_SUPPLY_USDC) {
    const d = await supplyIdleToPlp(executor, {
      managerId: opts.managerId,
      recipient: opts.recipient,
      amountUsdc: plpTarget,
    });
    if (d) digests.push(d);
  }

  try {
    const tailStrike = usdToPredictStrike(opts.forwardUsd * 0.9);
    const mintKey = await resolveMintStrike(opts.oracleId, opts.forwardUsd * 0.9);
    const d = await mintOnce(executor, {
      managerId: opts.managerId,
      oracleId: opts.oracleId,
      strikeUsd: opts.forwardUsd * 0.9,
      isUp: false,
      quantity: 1,
    });
    digests.push(d);
    void tailStrike;
    void mintKey;
  } catch (e) {
    console.warn("bear tail mint:", e instanceof Error ? e.message : e);
  }

  return { txDigests: digests, plpSupplyUsdc: plpTarget };
}

export async function parlayMintsOnChain(
  executor: PredictExecutor,
  opts: {
    managerId: string;
    btcOracleId: string;
    strikeUsd: number;
    forwardUsd: number;
  },
): Promise<string[]> {
  const digests: string[] = [];
  digests.push(
    await mintOnce(executor, {
      managerId: opts.managerId,
      oracleId: opts.btcOracleId,
      strikeUsd: opts.strikeUsd,
      isUp: true,
      quantity: 1,
    }),
  );

  const ethOracle = await fetchActiveOracle("ETH");
  const leg2Oracle = ethOracle?.oracleId ?? opts.btcOracleId;
  const ethStrike = ethOracle
    ? opts.strikeUsd * 0.04
    : opts.forwardUsd;
  digests.push(
    await mintOnce(executor, {
      managerId: opts.managerId,
      oracleId: leg2Oracle,
      strikeUsd: ethStrike,
      isUp: true,
      quantity: 1,
    }),
  );
  return digests;
}

export function onChainVwap(usd: number): number {
  return Math.max(1, Math.round(usd));
}

export type { EarnSupplyParams };
