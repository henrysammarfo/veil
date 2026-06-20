/** Submit Veil ExecutionProof on-chain after enclave attestation (user wallet / Enoki). */
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import {
  buildRecordExecutionPtb,
  buildRecordParlayExecutionPtb,
} from "../../../packages/sdk/src/veil-ptb";
import { VEIL_PACKAGE_IDS, VEIL_CONFIG } from "./config";
import { createSponsoredTransaction, executeSponsoredTransaction } from "./api";

export interface OnChainAttestationPayload {
  digest: string;
  signature: string;
  publicKey: string;
  mode: number;
  vwap: number;
  impactBps: number;
  fills: number;
  blobId: string;
  enclaveId: string;
}

export interface ParlayRecordParams {
  convictionBps: number;
  marketProbBps: number;
  correlationBps: number;
  legCount: number;
}

export interface ExecuteOrderResult {
  onChainAttestation?: OnChainAttestationPayload;
  parlayRecordParams?: ParlayRecordParams;
  executionId?: string;
}

function getClient() {
  return new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl(VEIL_CONFIG.suiNetwork),
    network: VEIL_CONFIG.suiNetwork,
  });
}

function toB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function buildRecordProofTransaction(
  result: ExecuteOrderResult,
): Promise<Transaction | null> {
  const att = result.onChainAttestation;
  const pkg = VEIL_PACKAGE_IDS.veilPackageId;
  const registry = VEIL_PACKAGE_IDS.registryId;
  if (!att || !pkg || !registry) return null;

  const base = {
    packageId: pkg,
    registryId: registry,
    attestationDigestHex: att.digest,
    enclaveSignatureHex: att.signature,
    enclaveIdUtf8: att.enclaveId,
    vwap: BigInt(att.vwap),
    impactBps: BigInt(att.impactBps),
    fills: att.fills,
    blobIdUtf8: att.blobId,
  };

  if (att.mode === 4 && result.parlayRecordParams) {
    const p = result.parlayRecordParams;
    return buildRecordParlayExecutionPtb({
      ...base,
      mode: att.mode,
      convictionBps: BigInt(p.convictionBps),
      marketProbBps: BigInt(p.marketProbBps),
      correlationBps: BigInt(p.correlationBps),
      legCount: p.legCount,
    });
  }

  return buildRecordExecutionPtb({ ...base, mode: att.mode });
}

/** Sign + execute record_execution via Enoki sponsorship (zkLogin JWT). */
export async function recordProofWithEnoki(
  result: ExecuteOrderResult,
  jwt: string,
  signTransaction: (input: { transaction: Transaction }) => Promise<{ signature: string }>,
): Promise<string | null> {
  const tx = await buildRecordProofTransaction(result);
  if (!tx) return null;
  const client = getClient();
  const kindBytes = await tx.build({
    client,
    onlyTransactionKind: true,
  });
  const sponsored = await createSponsoredTransaction({
    jwt,
    transactionKindBytes: toB64(kindBytes),
    network: "testnet",
  });
  const txToSign = Transaction.from(fromB64(sponsored.bytes));
  const signed = await signTransaction({ transaction: txToSign });
  const executed = await executeSponsoredTransaction({
    digest: sponsored.digest,
    signature: signed.signature,
  });
  return executed.digest;
}

/** Direct wallet sign (extension wallet). */
export async function recordProofWithWallet(
  result: ExecuteOrderResult,
  signAndExecute: (input: { transaction: Transaction }) => Promise<{ digest: string }>,
): Promise<string | null> {
  const tx = await buildRecordProofTransaction(result);
  if (!tx) return null;
  const res = await signAndExecute({ transaction: tx });
  return res.digest;
}

export { executeSponsoredTransaction };
