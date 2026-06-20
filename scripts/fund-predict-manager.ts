#!/usr/bin/env npx tsx
/** Deposit wallet dUSDC into PREDICT_MANAGER_ID for live mints. */
import "../packages/sdk/src/load-env.ts";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { PREDICT_TESTNET } from "../packages/sdk/src/config/testnet.ts";

const DUSDC = PREDICT_TESTNET.dusdcType;
const DECIMALS = 6;

async function main() {
  const key = process.env.SUI_PRIVATE_KEY;
  const managerId = process.env.PREDICT_MANAGER_ID;
  if (!key) throw new Error("SUI_PRIVATE_KEY required");
  if (!managerId) throw new Error("PREDICT_MANAGER_ID required");

  const depositUsdc = Number(process.env.FUND_MANAGER_USDC ?? "100");
  if (!Number.isFinite(depositUsdc) || depositUsdc <= 0) {
    throw new Error("FUND_MANAGER_USDC must be a positive number");
  }
  const depositAmount = BigInt(Math.round(depositUsdc * 10 ** DECIMALS));

  const keypair = Ed25519Keypair.fromSecretKey(key);
  const owner = keypair.getPublicKey().toSuiAddress();
  const client = new SuiJsonRpcClient({
    url: process.env.SUI_RPC_URL ?? getJsonRpcFullnodeUrl("testnet"),
    network: "testnet",
  });

  const coins = await client.getCoins({ owner, coinType: DUSDC });
  if (coins.data.length === 0) throw new Error(`No dUSDC coins for ${owner}`);

  const total = coins.data.reduce((sum, c) => sum + BigInt(c.balance), 0n);
  console.log(`Wallet dUSDC: ${Number(total) / 10 ** DECIMALS} (${coins.data.length} coin(s))`);
  if (total < depositAmount) {
    throw new Error(`Need ${depositUsdc} dUSDC, wallet has ${Number(total) / 10 ** DECIMALS}`);
  }

  const tx = new Transaction();
  tx.setSenderIfNotSet(owner);

  const primary = tx.object(coins.data[0].coinObjectId);
  if (coins.data.length > 1) {
    tx.mergeCoins(
      primary,
      coins.data.slice(1).map((c) => tx.object(c.coinObjectId)),
    );
  }

  const [depositCoin] = tx.splitCoins(primary, [depositAmount]);
  tx.moveCall({
    target: `${PREDICT_TESTNET.packageId}::predict_manager::deposit`,
    typeArguments: [DUSDC],
    arguments: [tx.object(managerId), depositCoin],
  });

  const result = await client.core.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
  });

  console.log("Deposited", depositUsdc, "dUSDC into manager", managerId);
  console.log("Tx:", result.digest ?? (result as { transaction?: { digest?: string } }).transaction?.digest);

  const summary = await fetch(
    `${PREDICT_TESTNET.serverUrl}/managers/${managerId}/summary`,
  ).then((r) => r.json());
  console.log("Manager balance:", summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
