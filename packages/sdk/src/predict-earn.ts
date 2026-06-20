/** Earn path — withdraw manager dUSDC → PLP supply; keeper redeems + compounds */
import { Transaction } from "@mysten/sui/transactions";
import { PREDICT_TESTNET } from "./config/testnet.js";
import {
  KEEPER_DRIP_USDC,
  MANAGER_MINT_RESERVE_USDC,
  MAX_EARN_SUPPLY_USDC,
  MIN_EARN_SUPPLY_USDC,
  microToUsdc,
  usdcToMicro,
} from "./constants.js";
import {
  fetchManagerSummary,
  fetchManagerPositions,
  type ManagerPositionRow,
} from "./predict-market.js";
import { buildRedeemPermissionlessPtb } from "./predict-ptb.js";
import type { PredictExecutor } from "./predict-executor.js";

const PKG = PREDICT_TESTNET.packageId;
const DUSDC = PREDICT_TESTNET.dusdcType;

export interface EarnSupplyParams {
  managerId: string;
  recipient: string;
  /** Target supply in USDC (capped by available balance minus reserve) */
  amountUsdc: number;
  reserveUsdc?: number;
}

/** Withdraw dUSDC from PredictManager and supply to PLP vault (earn yield). */
export function buildWithdrawAndSupplyPtb(params: EarnSupplyParams): Transaction {
  const reserve = params.reserveUsdc ?? MANAGER_MINT_RESERVE_USDC;
  const tx = new Transaction();
  const amountMicro = usdcToMicro(params.amountUsdc);
  const coin = tx.moveCall({
    target: `${PKG}::predict_manager::withdraw`,
    typeArguments: [DUSDC],
    arguments: [tx.object(params.managerId), tx.pure.u64(amountMicro)],
  });
  const plp = tx.moveCall({
    target: `${PKG}::predict::supply`,
    typeArguments: [DUSDC],
    arguments: [tx.object(PREDICT_TESTNET.predictObjectId), coin, tx.object.clock()],
  });
  tx.transferObjects([plp], tx.pure.address(params.recipient));
  return tx;
}

export async function fetchManagerBalanceUsdc(managerId: string): Promise<number> {
  const summary = await fetchManagerSummary(managerId);
  if (!summary) return 0;
  return microToUsdc(summary.balanceMicro);
}

/** dUSDC above mint reserve, capped per tx (never the full manager balance). */
export async function computeEarnableUsdc(managerId: string): Promise<number> {
  const balance = await fetchManagerBalanceUsdc(managerId);
  const idle = balance - MANAGER_MINT_RESERVE_USDC;
  if (idle < MIN_EARN_SUPPLY_USDC) return 0;
  return Math.min(idle, MAX_EARN_SUPPLY_USDC);
}

/** Clamp a requested earn/supply size to [min, max] and available idle balance. */
export async function clampEarnSupplyUsdc(
  managerId: string,
  requestedUsdc: number,
): Promise<number> {
  const earnable = await computeEarnableUsdc(managerId);
  if (earnable < MIN_EARN_SUPPLY_USDC) return 0;
  const want = Math.max(requestedUsdc, MIN_EARN_SUPPLY_USDC);
  return Math.min(want, earnable);
}

/** Keeper: reinvest only a small drip from redeemed proceeds. */
export function keeperResupplyChunk(redeemedUsdc: number): number {
  if (redeemedUsdc < MIN_EARN_SUPPLY_USDC) return 0;
  return Math.min(redeemedUsdc, KEEPER_DRIP_USDC, MAX_EARN_SUPPLY_USDC);
}

export async function supplyIdleToPlp(
  executor: PredictExecutor,
  params: EarnSupplyParams,
): Promise<string | null> {
  const amount = await clampEarnSupplyUsdc(params.managerId, params.amountUsdc);
  if (amount < MIN_EARN_SUPPLY_USDC) return null;
  const tx = buildWithdrawAndSupplyPtb({ ...params, amountUsdc: amount });
  return executor.execute(tx);
}

export async function fetchRedeemablePositions(
  managerId: string,
): Promise<ManagerPositionRow[]> {
  const rows = await fetchManagerPositions(managerId);
  return rows.filter(
    (p) =>
      p.openQuantity > 0 &&
      (p.status === "awaiting_settlement" ||
        p.status === "settled" ||
        p.redeemableUsdc > 0),
  );
}

export async function redeemSettledPosition(
  executor: PredictExecutor,
  pos: ManagerPositionRow,
  managerId: string,
): Promise<string> {
  const tx = buildRedeemPermissionlessPtb({
    managerId,
    oracleId: pos.oracleId,
    expiry: pos.expiry,
    strike: pos.strike,
    isUp: pos.isUp,
    quantity: pos.openQuantity,
  });
  return executor.execute(tx);
}
