import { Transaction } from "@mysten/sui/transactions";

export interface RecordExecutionParams {
  packageId: string;
  registryId: string;
  attestationDigestHex: string;
  enclaveSignatureHex: string;
  enclaveIdUtf8: string;
  mode: number;
  vwap: bigint;
  impactBps: bigint;
  fills: number;
  blobIdUtf8: string;
}

export interface RecordParlayExecutionParams extends RecordExecutionParams {
  convictionBps: bigint;
  marketProbBps: bigint;
  correlationBps: bigint;
  legCount: number;
}

function hexToBytes(hex: string): number[] {
  const h = hex.replace(/^0x/, "");
  if (h.length % 2 !== 0) throw new Error("invalid hex");
  return Array.from(Buffer.from(h, "hex"));
}

function utf8Bytes(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}

/** User-signed: mint ExecutionProof on Veil package after enclave attestation. */
export function buildRecordExecutionPtb(params: RecordExecutionParams): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${params.packageId}::execution_proof::record_execution`,
    arguments: [
      tx.object(params.registryId),
      tx.pure.vector("u8", hexToBytes(params.attestationDigestHex)),
      tx.pure.vector("u8", hexToBytes(params.enclaveSignatureHex)),
      tx.pure.vector("u8", utf8Bytes(params.enclaveIdUtf8)),
      tx.pure.u8(params.mode),
      tx.pure.u64(params.vwap),
      tx.pure.u64(params.impactBps),
      tx.pure.u8(params.fills),
      tx.pure.vector("u8", utf8Bytes(params.blobIdUtf8)),
      tx.pure.option("id", null),
    ],
  });
  return tx;
}

/** User-signed: create parlay + record PARLAY proof in one PTB. */
export function buildRecordParlayExecutionPtb(params: RecordParlayExecutionParams): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${params.packageId}::execution_proof::record_parlay_execution`,
    arguments: [
      tx.object(params.registryId),
      tx.pure.vector("u8", hexToBytes(params.attestationDigestHex)),
      tx.pure.vector("u8", hexToBytes(params.enclaveSignatureHex)),
      tx.pure.vector("u8", utf8Bytes(params.enclaveIdUtf8)),
      tx.pure.u64(params.vwap),
      tx.pure.u64(params.impactBps),
      tx.pure.u8(params.fills),
      tx.pure.vector("u8", utf8Bytes(params.blobIdUtf8)),
      tx.pure.u64(params.convictionBps),
      tx.pure.u64(params.marketProbBps),
      tx.pure.u64(params.correlationBps),
      tx.pure.u8(params.legCount),
    ],
  });
  return tx;
}
