import { Transaction } from "@mysten/sui/transactions";
import { PREDICT_TESTNET } from "./config/testnet.js";
import { usdcToMicro } from "./constants.js";

const PKG = PREDICT_TESTNET.packageId;
const DUSDC = PREDICT_TESTNET.dusdcType;

export interface MarketKeyParams {
  oracleId: string;
  expiry: number;
  strike: number;
  isUp: boolean;
}

export interface MintPositionParams extends MarketKeyParams {
  predictId?: string;
  managerId: string;
  quantity: number;
}

export interface RedeemPermissionlessParams extends MarketKeyParams {
  predictId?: string;
  managerId: string;
  quantity: number;
}

export interface SupplyPlpParams {
  predictId?: string;
  /** dUSDC coin object id to supply */
  coinId: string;
}

export interface DepositManagerParams {
  managerId: string;
  /** dUSDC coin object id (full coin deposited) */
  coinId: string;
}

/** Build MarketKey via deepbook_predict::market_key::new */
export function buildMarketKey(tx: Transaction, params: MarketKeyParams) {
  return tx.moveCall({
    target: `${PKG}::market_key::new`,
    arguments: [
      tx.pure.id(params.oracleId),
      tx.pure.u64(params.expiry),
      tx.pure.u64(params.strike),
      tx.pure.bool(params.isUp),
    ],
  });
}

/** predict::create_manager — returns shared PredictManager */
export function buildCreateManagerPtb(): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PKG}::predict::create_manager`,
    arguments: [],
  });
  return tx;
}

/** predict::mint — binary position from PredictManager balance */
export function buildMintPtb(params: MintPositionParams): Transaction {
  const tx = new Transaction();
  const predictId = params.predictId ?? PREDICT_TESTNET.predictObjectId;
  const key = buildMarketKey(tx, params);
  tx.moveCall({
    target: `${PKG}::predict::mint`,
    typeArguments: [DUSDC],
    arguments: [
      tx.object(predictId),
      tx.object(params.managerId),
      tx.object(params.oracleId),
      key,
      tx.pure.u64(params.quantity),
      tx.object.clock(),
    ],
  });
  return tx;
}

/** predict_manager::deposit — fund PredictManager with dUSDC before mint */
export function buildDepositManagerPtb(params: DepositManagerParams): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PKG}::predict_manager::deposit`,
    typeArguments: [DUSDC],
    arguments: [tx.object(params.managerId), tx.object(params.coinId)],
  });
  return tx;
}

/** Split wallet dUSDC and deposit into PredictManager in one tx. */
export function buildDepositManagerAmountPtb(params: {
  managerId: string;
  coinId: string;
  amountUsdc: number;
}): Transaction {
  const tx = new Transaction();
  const [depositCoin] = tx.splitCoins(tx.object(params.coinId), [
    tx.pure.u64(usdcToMicro(params.amountUsdc)),
  ]);
  tx.moveCall({
    target: `${PKG}::predict_manager::deposit`,
    typeArguments: [DUSDC],
    arguments: [tx.object(params.managerId), depositCoin],
  });
  return tx;
}

/** predict_manager::withdraw — return idle dUSDC to wallet (not locked in open positions). */
export function buildWithdrawManagerToWalletPtb(params: {
  managerId: string;
  amountUsdc: number;
  recipient: string;
}): Transaction {
  const tx = new Transaction();
  const coin = tx.moveCall({
    target: `${PKG}::predict_manager::withdraw`,
    typeArguments: [DUSDC],
    arguments: [tx.object(params.managerId), tx.pure.u64(usdcToMicro(params.amountUsdc))],
  });
  tx.transferObjects([coin], tx.pure.address(params.recipient));
  return tx;
}

/** predict::supply — deposit dUSDC, receive PLP */
export function buildSupplyPtb(params: SupplyPlpParams, recipient: string): Transaction {
  const tx = new Transaction();
  const predictId = params.predictId ?? PREDICT_TESTNET.predictObjectId;
  const plp = tx.moveCall({
    target: `${PKG}::predict::supply`,
    typeArguments: [DUSDC],
    arguments: [tx.object(predictId), tx.object(params.coinId), tx.object.clock()],
  });
  tx.transferObjects([plp], tx.pure.address(recipient));
  return tx;
}

/** predict::redeem_permissionless — keeper redeems settled positions */
export function buildRedeemPermissionlessPtb(params: RedeemPermissionlessParams): Transaction {
  const tx = new Transaction();
  const predictId = params.predictId ?? PREDICT_TESTNET.predictObjectId;
  const key = buildMarketKey(tx, params);
  tx.moveCall({
    target: `${PKG}::predict::redeem_permissionless`,
    typeArguments: [DUSDC],
    arguments: [
      tx.object(predictId),
      tx.object(params.managerId),
      tx.object(params.oracleId),
      key,
      tx.pure.u64(params.quantity),
      tx.object.clock(),
    ],
  });
  return tx;
}
