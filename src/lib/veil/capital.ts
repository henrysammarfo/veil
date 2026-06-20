import { Transaction } from "@mysten/sui/transactions";
import { PREDICT_TESTNET } from "../../../packages/sdk/src/config/testnet";
import { fetchManagerForOwner } from "../../../packages/sdk/src/predict-market";
import {
  buildCreateManagerPtb,
  buildRedeemPermissionlessPtb,
  buildWithdrawManagerToWalletPtb,
} from "../../../packages/sdk/src/predict-ptb";
import type { ManagerPositionRow } from "../../../packages/sdk/src/predict-market";
import { microToUsdc } from "../../../packages/sdk/src/constants";
import { VEIL_CONFIG } from "./config";
import { savePrefs } from "./prefs";

const DUSDC = PREDICT_TESTNET.dusdcType;

type CoinRow = { coinObjectId: string; balance: string };
type CoinClient = {
  getCoins: (input: { owner: string; coinType: string }) => Promise<{ data: CoinRow[] }>;
};

export interface ManagerSnapshot {
  managerId: string | null;
  balanceUsdc: number;
  openPositions: number;
  awaitingSettlement: number;
}

export async function fetchManagerSnapshot(owner: string): Promise<ManagerSnapshot> {
  const res = await fetch(`${VEIL_CONFIG.apiUrl}/api/manager?owner=${encodeURIComponent(owner)}`);
  if (!res.ok) {
    return { managerId: null, balanceUsdc: 0, openPositions: 0, awaitingSettlement: 0 };
  }
  return res.json() as Promise<ManagerSnapshot>;
}

export async function fetchRedeemablePositions(managerId: string): Promise<ManagerPositionRow[]> {
  const res = await fetch(
    `${VEIL_CONFIG.apiUrl}/api/manager/${encodeURIComponent(managerId)}/positions`,
  );
  if (!res.ok) return [];
  return res.json() as Promise<ManagerPositionRow[]>;
}

export async function fetchWalletDusdcBalance(client: CoinClient, owner: string): Promise<number> {
  const coins = await client.getCoins({ owner, coinType: DUSDC });
  const total = coins.data.reduce((sum: bigint, c: CoinRow) => sum + BigInt(c.balance), 0n);
  return microToUsdc(total);
}

export async function persistPredictManagerId(owner: string, managerId: string): Promise<void> {
  await savePrefs(owner, { predictManagerId: managerId });
}

export async function createPredictManager(
  owner: string,
  signAndExecute: (input: { transaction: Transaction }) => Promise<unknown>,
): Promise<string> {
  const tx = buildCreateManagerPtb();
  tx.setSenderIfNotSet(owner);
  await signAndExecute({ transaction: tx });
  for (let i = 0; i < 6; i++) {
    const id = await fetchManagerForOwner(owner);
    if (id) {
      await persistPredictManagerId(owner, id);
      return id;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("PredictManager not indexed yet — refresh in a few seconds");
}

export async function buildDepositTx(
  client: CoinClient,
  owner: string,
  managerId: string,
  amountUsdc: number,
): Promise<Transaction> {
  const coins = await client.getCoins({ owner, coinType: DUSDC });
  if (coins.data.length === 0) throw new Error("No dUSDC in wallet");

  const tx = new Transaction();
  tx.setSenderIfNotSet(owner);
  const primary = tx.object(coins.data[0]!.coinObjectId);
  if (coins.data.length > 1) {
    tx.mergeCoins(
      primary,
      coins.data.slice(1).map((c: CoinRow) => tx.object(c.coinObjectId)),
    );
  }
  const amountMicro = BigInt(Math.round(amountUsdc * 1_000_000));
  const [coin] = tx.splitCoins(primary, [tx.pure.u64(amountMicro)]);
  tx.moveCall({
    target: `${PREDICT_TESTNET.packageId}::predict_manager::deposit`,
    typeArguments: [DUSDC],
    arguments: [tx.object(managerId), coin],
  });
  return tx;
}

export function buildWithdrawTx(
  managerId: string,
  owner: string,
  amountUsdc: number,
): Transaction {
  const tx = buildWithdrawManagerToWalletPtb({ managerId, amountUsdc, recipient: owner });
  tx.setSenderIfNotSet(owner);
  return tx;
}

export function buildRedeemTx(
  managerId: string,
  owner: string,
  pos: ManagerPositionRow,
): Transaction {
  const tx = buildRedeemPermissionlessPtb({
    managerId,
    oracleId: pos.oracleId,
    expiry: pos.expiry,
    strike: pos.strike,
    isUp: pos.isUp,
    quantity: pos.openQuantity,
  });
  tx.setSenderIfNotSet(owner);
  return tx;
}

export const PREDICT_FAUCET_URL = PREDICT_TESTNET.faucetUrl;
