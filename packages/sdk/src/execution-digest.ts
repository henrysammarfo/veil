/** Canonical execution digest — must match veil::attestation::execution_digest (Move). */
import { bcs } from "@mysten/bcs";
import { blake2b } from "@noble/hashes/blake2.js";
import { ed25519 } from "@noble/curves/ed25519.js";

const MAGIC = new TextEncoder().encode("VEIL_EXEC_V1");

function blake2b256(data: Uint8Array): Uint8Array {
  return blake2b(data, { dkLen: 32 });
}

function serializeAddress(addr: string): Uint8Array {
  const hex = addr.replace(/^0x/, "").padStart(64, "0");
  return bcs.bytes(32).serialize(Uint8Array.from(Buffer.from(hex, "hex"))).toBytes();
}

export interface ExecutionDigestInput {
  trader: string;
  mode: number;
  vwap: bigint;
  impactBps: bigint;
  fills: number;
  blobId: Uint8Array;
  enclaveId: Uint8Array;
}

export function buildExecutionDigest(input: ExecutionDigestInput): Uint8Array {
  const parts = [
    MAGIC,
    serializeAddress(input.trader),
    bcs.u8().serialize(input.mode).toBytes(),
    bcs.u64().serialize(input.vwap).toBytes(),
    bcs.u64().serialize(input.impactBps).toBytes(),
    bcs.u8().serialize(input.fills).toBytes(),
    bcs.vector(bcs.u8()).serialize([...input.blobId]).toBytes(),
    bcs.vector(bcs.u8()).serialize([...input.enclaveId]).toBytes(),
  ];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const payload = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    payload.set(p, off);
    off += p.length;
  }
  return blake2b256(payload);
}

export function deriveEnclaveSigningKey(enclaveSecret: string): {
  publicKey: Uint8Array;
  signDigest: (digest: Uint8Array) => Uint8Array;
} {
  const seed = blake2b256(new TextEncoder().encode(`${enclaveSecret}:ed25519-signing-v1`));
  const publicKey = ed25519.getPublicKey(seed);
  return {
    publicKey,
    signDigest: (digest: Uint8Array) => ed25519.sign(digest, seed),
  };
}

export function signExecutionAttestation(
  enclaveSecret: string,
  input: ExecutionDigestInput,
): { digest: Uint8Array; signature: Uint8Array; publicKey: Uint8Array } {
  const { publicKey, signDigest } = deriveEnclaveSigningKey(enclaveSecret);
  const digest = buildExecutionDigest(input);
  return { digest, signature: signDigest(digest), publicKey };
}

export function toHexBytes(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}
