/// Attestation verification — Ed25519 signature + digest binding per Sui `sui::ed25519` docs.
module veil::attestation;

use sui::ed25519;
use sui::hash;
use std::bcs;
use veil::registry::{Self, Registry, EnclaveRecord};

const EEmptyAttestation: u64 = 30;
const EInvalidHashLen: u64 = 31;
const EInvalidSignature: u64 = 32;
const EBadSignature: u64 = 33;
const ED25519_SIG_LEN: u64 = 64;
const ATTESTATION_HASH_LEN: u64 = 32;

const MAGIC: vector<u8> = b"VEIL_EXEC_V1";

/// Canonical execution digest — must match off-chain enclave signing (Blake2b256).
public fun execution_digest(
    trader: address,
    mode: u8,
    vwap: u64,
    impact_bps: u64,
    fills: u8,
    blob_id: &vector<u8>,
    enclave_id: &vector<u8>,
): vector<u8> {
    let mut payload = MAGIC;
    payload.append(bcs::to_bytes(&trader));
    payload.append(bcs::to_bytes(&mode));
    payload.append(bcs::to_bytes(&vwap));
    payload.append(bcs::to_bytes(&impact_bps));
    payload.append(bcs::to_bytes(&fills));
    payload.append(bcs::to_bytes(blob_id));
    payload.append(bcs::to_bytes(enclave_id));
    hash::blake2b256(&payload)
}

public fun verify_enclave_registration(
    registry: &Registry,
    enclave_id: vector<u8>,
): &EnclaveRecord {
    registry::verify_enclave_active(registry, enclave_id)
}

/// Verify digest binding, Ed25519 signature, enclave registration, and consume attestation.
public fun verify_execution_attestation(
    registry: &mut Registry,
    enclave_id: vector<u8>,
    attestation_hash: vector<u8>,
    enclave_signature: vector<u8>,
    trader: address,
    mode: u8,
    vwap: u64,
    impact_bps: u64,
    fills: u8,
    blob_id: &vector<u8>,
) {
    assert!(attestation_hash.length() == ATTESTATION_HASH_LEN, EInvalidHashLen);
    assert!(attestation_hash.length() > 0, EEmptyAttestation);
    assert!(enclave_signature.length() == ED25519_SIG_LEN, EInvalidSignature);

    let expected = execution_digest(trader, mode, vwap, impact_bps, fills, blob_id, &enclave_id);
    let pk = {
        let record = verify_enclave_registration(registry, enclave_id);
        assert!(attestation_hash == expected, EBadSignature);
        *registry::public_key(record)
    };
    assert!(
        ed25519::ed25519_verify(&enclave_signature, &pk, &attestation_hash),
        EBadSignature,
    );

    registry::consume_attestation(registry, attestation_hash);
}
