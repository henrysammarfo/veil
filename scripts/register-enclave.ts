#!/usr/bin/env npx tsx
/** Register Veil enclave on-chain — Nitro (Nautilus) or manual PCR fallback. */
import "../packages/sdk/src/load-env.ts";
import { Transaction } from "@mysten/sui/transactions";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromHex } from "@mysten/sui/utils";

const ENCLAVE_URL = process.env.VEIL_ENCLAVE_URL ?? process.env.VITE_VEIL_ENCLAVE_URL ?? "http://127.0.0.1:8080";
const PACKAGE_ID = process.env.VEIL_PACKAGE_ID!;
const REGISTRY_ID = process.env.VEIL_REGISTRY_ID!;
const ADMIN_CAP_ID = process.env.VEIL_ADMIN_CAP_ID!;
const SUI_KEY = process.env.SUI_PRIVATE_KEY!;
const CLOCK_ID = "0x6";

type AttestationJson = {
  enclaveId: string;
  publicKey: string;
  pcr0: string;
  pcr1: string;
  pcr2: string;
  attestation?: string;
  attestationSource?: string;
};

async function main() {
  if (!PACKAGE_ID || !REGISTRY_ID || !ADMIN_CAP_ID || !SUI_KEY) {
    throw new Error("Set VEIL_PACKAGE_ID, VEIL_REGISTRY_ID, VEIL_ADMIN_CAP_ID, SUI_PRIVATE_KEY");
  }

  const attRes = await fetch(`${ENCLAVE_URL}/get_attestation`);
  if (!attRes.ok) {
    const err = await attRes.json().catch(() => ({}));
    throw new Error(`get_attestation ${attRes.status}: ${JSON.stringify(err)}`);
  }
  const att = (await attRes.json()) as AttestationJson;

  const tx = new Transaction();
  const enclaveIdBytes = [...new TextEncoder().encode(att.enclaveId)];

  if (process.env.VEIL_REGISTER_FORCE === "1") {
    tx.moveCall({
      target: `${PACKAGE_ID}::registry::deactivate_enclave`,
      arguments: [
        tx.object(REGISTRY_ID),
        tx.object(ADMIN_CAP_ID),
        tx.pure.vector("u8", enclaveIdBytes),
      ],
    });
    console.log("Deactivating prior enclave registration…");
  }

  if (att.attestation && att.attestation.length > 0) {
    const attBytes = [...fromHex(att.attestation.replace(/^0x/i, ""))];
    const [document] = tx.moveCall({
      target: "0x2::nitro_attestation::load_nitro_attestation",
      arguments: [tx.pure.vector("u8", attBytes), tx.object(CLOCK_ID)],
    });
    tx.moveCall({
      target: `${PACKAGE_ID}::registry::register_enclave_nitro`,
      arguments: [
        tx.object(REGISTRY_ID),
        tx.object(ADMIN_CAP_ID),
        tx.pure.vector("u8", enclaveIdBytes),
        document,
        tx.pure.string("veil-nitro-prod"),
      ],
    });
    console.log("Registering via Nitro attestation (on-chain verify)…");
  } else {
    tx.moveCall({
      target: `${PACKAGE_ID}::registry::register_enclave`,
      arguments: [
        tx.object(REGISTRY_ID),
        tx.object(ADMIN_CAP_ID),
        tx.pure.vector("u8", enclaveIdBytes),
        tx.pure.vector("u8", [...fromHex(att.pcr0.replace(/^0x/i, ""))]),
        tx.pure.vector("u8", [...fromHex(att.pcr1.replace(/^0x/i, ""))]),
        tx.pure.vector("u8", [...fromHex(att.pcr2.replace(/^0x/i, ""))]),
        tx.pure.vector("u8", [...fromHex(att.publicKey.replace(/^0x/i, ""))]),
        tx.pure.string("veil-env-pcr"),
      ],
    });
    console.log(`Registering via env PCR (${att.attestationSource ?? "manual"})…`);
  }

  const client = new SuiJsonRpcClient({
    url: process.env.SUI_RPC_URL ?? getJsonRpcFullnodeUrl("testnet"),
    network: "testnet",
  });
  const keypair = Ed25519Keypair.fromSecretKey(SUI_KEY);
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true },
  });

  console.log("Enclave registered:", att.enclaveId);
  console.log("PCR0:", att.pcr0.slice(0, 24) + "…");
  console.log("Digest:", result.digest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
