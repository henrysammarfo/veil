#!/usr/bin/env npx tsx
/** Fuzz execution digest — TS must match Move attestation::execution_digest. */
import { buildExecutionDigest } from "../packages/sdk/src/execution-digest.ts";
import { blake2b } from "@noble/hashes/blake2.js";
import { bcs } from "@mysten/bcs";

const MAGIC = new TextEncoder().encode("VEIL_EXEC_V1");
const TRADER = "0x0000000000000000000000000000000000000000000000000000000000beef";

function moveStyleDigest(
  trader: string,
  mode: number,
  vwap: bigint,
  impact: bigint,
  fills: number,
  blob: Uint8Array,
  enclave: Uint8Array,
): Uint8Array {
  const hex = trader.replace(/^0x/, "").padStart(64, "0");
  const parts = [
    MAGIC,
    bcs.bytes(32).serialize(Uint8Array.from(Buffer.from(hex, "hex"))).toBytes(),
    bcs.u8().serialize(mode).toBytes(),
    bcs.u64().serialize(vwap).toBytes(),
    bcs.u64().serialize(impact).toBytes(),
    bcs.u8().serialize(fills).toBytes(),
    bcs.vector(bcs.u8()).serialize([...blob]).toBytes(),
    bcs.vector(bcs.u8()).serialize([...enclave]).toBytes(),
  ];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const payload = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    payload.set(p, off);
    off += p.length;
  }
  return blake2b(payload, { dkLen: 32 });
}

let ok = 0;
for (let i = 0; i < 200; i++) {
  const mode = (i % 4) + 1;
  const vwap = BigInt(1000 + i);
  const impact = BigInt(i % 500);
  const fills = (i % 127) + 1;
  const blob = new TextEncoder().encode(`blob-${i}`);
  const enclave = new TextEncoder().encode(`enclave-${i % 17}`);
  const a = buildExecutionDigest({
    trader: TRADER,
    mode,
    vwap,
    impactBps: impact,
    fills,
    blobId: blob,
    enclaveId: enclave,
  });
  const b = moveStyleDigest(TRADER, mode, vwap, impact, fills, blob, enclave);
  if (Buffer.compare(Buffer.from(a), Buffer.from(b)) !== 0) {
    console.error("digest mismatch at iteration", i);
    process.exit(1);
  }
  ok++;
}
console.log(`FUZZ OK (${ok} digests)`);
