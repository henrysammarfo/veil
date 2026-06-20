/// Enclave registry — PCR measurements and Ed25519 public keys for attested TEE instances.
module veil::registry;

use sui::event;
use sui::table::{Self, Table};
use sui::nitro_attestation::{Self, NitroAttestationDocument, PCREntry};
use std::string::String;

/// Global registry shared object.
public struct Registry has key {
    id: UID,
    enclaves: Table<vector<u8>, EnclaveRecord>,
    used_attestations: Table<vector<u8>, bool>,
    admin: address,
    version: u16,
}

public struct EnclaveRecord has store, copy, drop {
    pcr0: vector<u8>,
    pcr1: vector<u8>,
    pcr2: vector<u8>,
    public_key: vector<u8>,
    label: String,
    active: bool,
}

public struct EnclaveRegistered has copy, drop {
    enclave_id: vector<u8>,
    label: String,
}

public struct EnclaveDeactivated has copy, drop {
    enclave_id: vector<u8>,
}

public struct AdminTransferred has copy, drop {
    previous_admin: address,
    new_admin: address,
}

/// Non-transferable admin capability (no `store`).
public struct AdminCap has key {
    id: UID,
}

const VERSION: u16 = 1;

const ENotAdmin: u64 = 1;
const EEnclaveExists: u64 = 2;
const EEnclaveNotFound: u64 = 3;
const EEnclaveInactive: u64 = 4;
const EInvalidEnclaveId: u64 = 5;
const EInvalidPublicKey: u64 = 6;
const EInvalidPcr: u64 = 7;
const EAttestationReplay: u64 = 8;
const EInvalidAdmin: u64 = 9;
const EAttestationHashLen: u64 = 10;

const MIN_ENCLAVE_ID_LEN: u64 = 16;
const MAX_ENCLAVE_ID_LEN: u64 = 64;
const ED25519_PK_LEN: u64 = 32;
const MIN_PCR_LEN: u64 = 32;
const MAX_PCR_LEN: u64 = 128;
const ATTESTATION_HASH_LEN: u64 = 32;

fun init(ctx: &mut TxContext) {
    let admin = ctx.sender();
    transfer::share_object(Registry {
        id: object::new(ctx),
        enclaves: table::new(ctx),
        used_attestations: table::new(ctx),
        admin,
        version: VERSION,
    });
    transfer::transfer(AdminCap { id: object::new(ctx) }, admin);
}

fun assert_admin(registry: &Registry, ctx: &TxContext) {
    assert!(registry.admin == ctx.sender(), ENotAdmin);
}

fun assert_valid_enclave_id(enclave_id: &vector<u8>) {
    let len = enclave_id.length();
    assert!(len >= MIN_ENCLAVE_ID_LEN && len <= MAX_ENCLAVE_ID_LEN, EInvalidEnclaveId);
}

fun assert_valid_public_key(public_key: &vector<u8>) {
    assert!(public_key.length() == ED25519_PK_LEN, EInvalidPublicKey);
}

fun assert_valid_pcr(pcr: &vector<u8>) {
    let len = pcr.length();
    assert!(len >= MIN_PCR_LEN && len <= MAX_PCR_LEN, EInvalidPcr);
}

fun pcr_at(entries: &vector<PCREntry>, idx: u8): vector<u8> {
    let mut i = 0;
    let len = entries.length();
    while (i < len) {
        let e = &entries[i];
        if (nitro_attestation::index(e) == idx) {
            return *nitro_attestation::value(e)
        };
        i = i + 1;
    };
    abort EInvalidPcr
}

/// Register a Nautilus enclave by id (hash of public key).
public fun register_enclave(
    registry: &mut Registry,
    _cap: &AdminCap,
    enclave_id: vector<u8>,
    pcr0: vector<u8>,
    pcr1: vector<u8>,
    pcr2: vector<u8>,
    public_key: vector<u8>,
    label: String,
    ctx: &mut TxContext,
) {
    assert_admin(registry, ctx);
    assert_valid_enclave_id(&enclave_id);
    assert_valid_public_key(&public_key);
    assert_valid_pcr(&pcr0);
    assert_valid_pcr(&pcr1);
    assert_valid_pcr(&pcr2);
    assert!(!registry.enclaves.contains(enclave_id), EEnclaveExists);
    registry.enclaves.add(
        enclave_id,
        EnclaveRecord {
            pcr0,
            pcr1,
            pcr2,
            public_key,
            label,
            active: true,
        },
    );
    event::emit(EnclaveRegistered { enclave_id, label });
}

/// Register enclave using a verified AWS Nitro attestation document (Nautilus flow).
/// Call `0x2::nitro_attestation::load_nitro_attestation` in the same PTB first.
public fun register_enclave_nitro(
    registry: &mut Registry,
    _cap: &AdminCap,
    enclave_id: vector<u8>,
    document: NitroAttestationDocument,
    label: String,
    ctx: &mut TxContext,
) {
    assert_admin(registry, ctx);
    assert_valid_enclave_id(&enclave_id);
    assert!(!registry.enclaves.contains(enclave_id), EEnclaveExists);

    let entries = nitro_attestation::pcrs(&document);
    let pcr0 = pcr_at(entries, 0);
    let pcr1 = pcr_at(entries, 1);
    let pcr2 = pcr_at(entries, 2);
    assert_valid_pcr(&pcr0);
    assert_valid_pcr(&pcr1);
    assert_valid_pcr(&pcr2);

    let pk_ref = nitro_attestation::public_key(&document);
    assert!(pk_ref.is_some(), EInvalidPublicKey);
    let public_key = *pk_ref.borrow();
    assert_valid_public_key(&public_key);

    registry.enclaves.add(
        enclave_id,
        EnclaveRecord {
            pcr0,
            pcr1,
            pcr2,
            public_key,
            label,
            active: true,
        },
    );
    event::emit(EnclaveRegistered { enclave_id, label });
}

public fun deactivate_enclave(
    registry: &mut Registry,
    _cap: &AdminCap,
    enclave_id: vector<u8>,
    ctx: &mut TxContext,
) {
    assert_admin(registry, ctx);
    assert!(registry.enclaves.contains(enclave_id), EEnclaveNotFound);
    let record = registry.enclaves.borrow_mut(enclave_id);
    record.active = false;
    event::emit(EnclaveDeactivated { enclave_id });
}

public fun transfer_admin(
    registry: &mut Registry,
    _cap: &AdminCap,
    new_admin: address,
    ctx: &mut TxContext,
) {
    assert_admin(registry, ctx);
    assert!(new_admin != @0x0, EInvalidAdmin);
    let previous = registry.admin;
    registry.admin = new_admin;
    event::emit(AdminTransferred { previous_admin: previous, new_admin });
}

public fun verify_enclave_active(registry: &Registry, enclave_id: vector<u8>): &EnclaveRecord {
    assert!(registry.enclaves.contains(enclave_id), EEnclaveNotFound);
    let record = registry.enclaves.borrow(enclave_id);
    assert!(record.active, EEnclaveInactive);
    record
}

/// Mark attestation digest as consumed — prevents replay of signed proofs.
public fun consume_attestation(registry: &mut Registry, attestation_hash: vector<u8>) {
    assert!(attestation_hash.length() == ATTESTATION_HASH_LEN, EAttestationHashLen);
    assert!(!registry.used_attestations.contains(attestation_hash), EAttestationReplay);
    registry.used_attestations.add(attestation_hash, true);
}

public fun pcr0(record: &EnclaveRecord): &vector<u8> {
    &record.pcr0
}

public fun public_key(record: &EnclaveRecord): &vector<u8> {
    &record.public_key
}

public fun version(registry: &Registry): u16 {
    registry.version
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext): (Registry, AdminCap) {
    let admin = ctx.sender();
    let registry = Registry {
        id: object::new(ctx),
        enclaves: table::new(ctx),
        used_attestations: table::new(ctx),
        admin,
        version: VERSION,
    };
    let cap = AdminCap { id: object::new(ctx) };
    (registry, cap)
}

#[test_only]
public fun share_for_testing(registry: Registry) {
    transfer::share_object(registry);
}
