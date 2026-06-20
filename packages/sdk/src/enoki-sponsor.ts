import { EnokiClient } from "@mysten/enoki";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import type { Transaction } from "@mysten/sui/transactions";
import { PREDICT_TESTNET } from "./config/testnet.js";

const PKG = PREDICT_TESTNET.packageId;

/** Move call targets allowlisted for Enoki sponsorship (DeepBook Predict testnet). */
export const PREDICT_SPONSOR_TARGETS = [
  `${PKG}::predict::mint`,
  `${PKG}::predict::supply`,
  `${PKG}::predict::redeem_permissionless`,
  `${PKG}::predict::create_manager`,
] as const;

function toB64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromB64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

export interface EnokiSponsorConfig {
  apiKey: string;
  network?: "testnet" | "devnet" | "mainnet";
  rpcUrl?: string;
  keypair: Ed25519Keypair;
  allowedMoveCallTargets?: string[];
}

/**
 * Execute a PTB via Enoki sponsored transactions (backend private API key).
 * @see https://docs.enoki.mystenlabs.com/ts-sdk/sponsored-transactions
 */
export async function executeSponsoredTransaction(
  tx: Transaction,
  config: EnokiSponsorConfig,
): Promise<string> {
  const network = config.network ?? "testnet";
  const client = new SuiJsonRpcClient({
    url: config.rpcUrl ?? getJsonRpcFullnodeUrl(network === "devnet" ? "testnet" : network),
    network: network === "devnet" ? "testnet" : network,
  });
  const sender = config.keypair.getPublicKey().toSuiAddress();
  tx.setSenderIfNotSet(sender);

  const kindBytes = await tx.build({ client, onlyTransactionKind: true });
  const enoki = new EnokiClient({ apiKey: config.apiKey });

  const sponsored = await enoki.createSponsoredTransaction({
    network,
    transactionKindBytes: toB64(kindBytes),
    sender,
    allowedMoveCallTargets: config.allowedMoveCallTargets ?? [...PREDICT_SPONSOR_TARGETS],
  });

  const signed = await config.keypair.signTransaction(fromB64(sponsored.bytes));
  const executed = await enoki.executeSponsoredTransaction({
    digest: sponsored.digest,
    signature: signed.signature,
  });
  return executed.digest;
}

export function createEnokiSponsorFromEnv(keypair: Ed25519Keypair): EnokiSponsorConfig | null {
  const apiKey = process.env.ENOKI_SECRET_KEY;
  if (!apiKey) return null;
  const network = (process.env.VITE_SUI_NETWORK ?? "testnet") as EnokiSponsorConfig["network"];
  return {
    apiKey,
    network,
    rpcUrl: process.env.SUI_RPC_URL,
    keypair,
  };
}
