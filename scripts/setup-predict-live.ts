#!/usr/bin/env npx tsx
/** Create PredictManager if missing; print live PREDICT_* env for .env */
import "../packages/sdk/src/load-env.ts";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { buildCreateManagerPtb } from "../packages/sdk/src/predict-ptb.ts";
import {
  fetchActiveOracle,
  fetchManagerForOwner,
  fetchOracleForward,
  usdToPredictStrike,
} from "../packages/sdk/src/predict-market.ts";

async function main() {
  const key = process.env.SUI_PRIVATE_KEY;
  if (!key) throw new Error("SUI_PRIVATE_KEY required");

  const keypair = Ed25519Keypair.fromSecretKey(key);
  const owner = keypair.getPublicKey().toSuiAddress();
  const client = new SuiJsonRpcClient({
    url: process.env.SUI_RPC_URL ?? getJsonRpcFullnodeUrl("testnet"),
    network: "testnet",
  });

  const oracle = await fetchActiveOracle("BTC");
  if (!oracle) throw new Error("No active BTC oracle on predict-server");

  let managerId = await fetchManagerForOwner(owner);
  if (!managerId) {
    console.log("Creating PredictManager for", owner);
    const tx = buildCreateManagerPtb();
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: { showObjectChanges: true },
    });
    const created = result.objectChanges?.find(
      (c) => c.type === "created" && String(c.objectType).includes("predict_manager::PredictManager"),
    );
    if (!created || created.type !== "created") {
      throw new Error("PredictManager not found in tx result");
    }
    managerId = created.objectId;
    console.log("Created manager:", managerId, "digest:", result.digest);
  } else {
    console.log("Existing manager:", managerId);
  }

  const forward = await fetchOracleForward(oracle.oracleId);
  const defaultStrike = forward ?? oracle.minStrike;

  console.log("\n# Add to .env:");
  console.log(`PREDICT_MANAGER_ID=${managerId}`);
  console.log(`PREDICT_ORACLE_ID=${oracle.oracleId}`);
  console.log(`PREDICT_ORACLE_EXPIRY=${oracle.expiry}`);
  console.log(`# default strike (forward): ${defaultStrike} (~$${(defaultStrike / 1e9).toFixed(0)}k)`);
  console.log(`# example 110k strike: ${usdToPredictStrike(110_000)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
