/**
 * AWS Nitro NSM attestation — Nautilus-compatible `/get_attestation`.
 * Requires `/dev/nsm` (inside a running Nitro Enclave on AWS EC2).
 * @see https://docs.sui.io/sui-stack/nautilus/nautilus-design
 */
import { existsSync } from "node:fs";
import cbor from "cbor";

export interface NitroAttestationPayload {
  attestation: string;
  pcr0: string;
  pcr1: string;
  pcr2: string;
  publicKey: string;
  attestationSource: "nitro";
}

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function asBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (value instanceof Buffer) return value;
  if (Array.isArray(value)) return Uint8Array.from(value);
  return null;
}

/** Parse PCR0–2 from a COSE-signed Nitro attestation document (SHA-384, 48 bytes). */
export function parsePcrsFromAttestationDoc(doc: Uint8Array): {
  pcr0: Uint8Array;
  pcr1: Uint8Array;
  pcr2: Uint8Array;
  publicKey: Uint8Array | null;
} {
  const cose = cbor.decode(doc) as unknown[];
  if (!Array.isArray(cose) || cose.length < 3) {
    throw new Error("invalid COSE Sign1 attestation");
  }
  const payloadRaw = cose[2];
  const payloadBytes = asBytes(payloadRaw);
  const inner = payloadBytes ? cbor.decode(payloadBytes) : payloadRaw;

  const map =
    inner instanceof Map
      ? inner
      : typeof inner === "object" && inner !== null
        ? new Map(Object.entries(inner as Record<string, unknown>))
        : null;
  if (!map) throw new Error("invalid attestation payload");

  const pcrsRaw = map.get(4) ?? map.get("pcrs");
  const pcrs =
    pcrsRaw instanceof Map
      ? pcrsRaw
      : typeof pcrsRaw === "object" && pcrsRaw !== null
        ? new Map(Object.entries(pcrsRaw as Record<string, unknown>))
        : null;
  if (!pcrs) throw new Error("attestation missing PCR map");

  const pcr0 = asBytes(pcrs.get(0) ?? pcrs.get("0"));
  const pcr1 = asBytes(pcrs.get(1) ?? pcrs.get("1"));
  const pcr2 = asBytes(pcrs.get(2) ?? pcrs.get("2"));
  if (!pcr0 || !pcr1 || !pcr2) throw new Error("attestation missing PCR0/1/2");

  const pkRaw = map.get(10) ?? map.get("public_key");
  const publicKey = pkRaw ? asBytes(pkRaw) : null;

  return { pcr0, pcr1, pcr2, publicKey };
}

async function requestNsmAttestation(publicKey: Uint8Array): Promise<Uint8Array | null> {
  if (process.platform !== "linux" || !existsSync("/dev/nsm")) return null;
  try {
    const nsm = await import("aws-nitro-enclaves-nsm-node");
    const fd = nsm.open();
    try {
      const doc = nsm.getAttestationDoc(
        fd,
        null,
        null,
        Buffer.from(publicKey),
      ) as Buffer;
      return Uint8Array.from(doc);
    } finally {
      nsm.close(fd);
    }
  } catch (e) {
    console.warn("NSM attestation unavailable:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Build Nautilus-style attestation response when running inside AWS Nitro. */
export async function buildNitroAttestation(
  publicKey: Uint8Array,
): Promise<NitroAttestationPayload | null> {
  const doc = await requestNsmAttestation(publicKey);
  if (!doc) return null;

  const { pcr0, pcr1, pcr2 } = parsePcrsFromAttestationDoc(doc);
  return {
    attestation: toHex(doc),
    pcr0: toHex(pcr0),
    pcr1: toHex(pcr1),
    pcr2: toHex(pcr2),
    publicKey: toHex(publicKey),
    attestationSource: "nitro",
  };
}

export function isNsmAvailable(): boolean {
  return process.platform === "linux" && existsSync("/dev/nsm");
}
