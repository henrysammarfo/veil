#!/usr/bin/env node
/** Generate Ed25519 test vectors matching veil::attestation::execution_digest (Move std::bcs + blake2b256). */
import { bcs } from "@mysten/bcs";
import { blake2b } from "@noble/hashes/blake2b.js";
import { ed25519 } from "@noble/curves/ed25519.js";
import { toHex } from "@mysten/sui/utils";

function blake2b256(data) {
  return blake2b(data, { dkLen: 32 });
}

const MAGIC = new TextEncoder().encode("VEIL_EXEC_V1");
const TRADER = "0x0000000000000000000000000000000000000000000000000000000000beef";
const MODE = 1;
const VWAP = 104847n;
const IMPACT = 21n;
const FILLS = 5;
const BLOB = new TextEncoder().encode("walrus-blob-id");
const ENCLAVE_ID_BYTES = new TextEncoder().encode("test-enclave-001");

const seed = blake2b256(new TextEncoder().encode("veil-move-test-seed"));
const pk = ed25519.getPublicKey(seed);

function serializeAddress(addr) {
  const hex = addr.replace(/^0x/, "").padStart(64, "0");
  return bcs.bytes(32).serialize(Uint8Array.from(Buffer.from(hex, "hex"))).toBytes();
}

function executionDigest(trader, mode, vwap, impactBps, fills, blobId, enclaveId) {
  const parts = [
    MAGIC,
    serializeAddress(trader),
    bcs.u8().serialize(mode).toBytes(),
    bcs.u64().serialize(vwap).toBytes(),
    bcs.u64().serialize(impactBps).toBytes(),
    bcs.u8().serialize(fills).toBytes(),
    bcs.vector(bcs.u8()).serialize([...blobId]).toBytes(),
    bcs.vector(bcs.u8()).serialize([...enclaveId]).toBytes(),
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

const digest = executionDigest(TRADER, MODE, VWAP, IMPACT, FILLS, BLOB, ENCLAVE_ID_BYTES);
const sig = ed25519.sign(digest, seed);

console.log(JSON.stringify({
  trader: TRADER,
  mode: MODE,
  vwap: Number(VWAP),
  impact: Number(IMPACT),
  fills: FILLS,
  blobHex: toHex(BLOB),
  enclaveIdHex: toHex(ENCLAVE_ID_BYTES),
  publicKeyHex: toHex(pk),
  digestHex: toHex(digest),
  signatureHex: toHex(sig),
}, null, 2));
