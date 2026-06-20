#[test_only]
#[allow(implicit_const_copy)]
module veil::veil_tests;

use veil::registry::{Self, Registry};
use veil::execution_proof;
use veil::attestation;
use veil::parlay;
use std::string::utf8;
use sui::test_scenario as ts;

const ADMIN: address = @0xAD;
const TRADER: address = @0xBEEF;

const TEST_PK: vector<u8> =
    x"f2d85a451ff3271898b2bb4c0aed43b98e7b99491895dd5093ad0f933db91ed0";
const TEST_DIGEST: vector<u8> =
    x"e29dbe70c5f1c4c391dabf9ca37521de22959638c5560d9babf2a78611a1eb65";
const TEST_SIG: vector<u8> =
    x"43594b5e92bd22e9aace46e4553d4edc43ef9bd54a38feebbd30dd74fd25557af001f9ca6fa3372ca91f8e5c423088ee4ec4b79ee529a10ba66a2b76904da209";

const ENCLAVE_ID: vector<u8> = b"test-enclave-001";
const BLOB_ID: vector<u8> = b"walrus-blob-id";
const PCR: vector<u8> =
    x"0000000000000000000000000000000000000000000000000000000000000000";

#[test]
fun execution_digest_matches_off_chain_vector() {
    let digest = attestation::execution_digest(
        TRADER,
        1,
        104847,
        21,
        5,
        &BLOB_ID,
        &ENCLAVE_ID,
    );
    assert!(digest == TEST_DIGEST);
}

#[test]
fun register_enclave_and_record_execution() {
    let mut scenario = ts::begin(ADMIN);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let (mut registry, cap) = registry::init_for_testing(ts::ctx(&mut scenario));
        let enclave_id = ENCLAVE_ID;
        registry::register_enclave(
            &mut registry,
            &cap,
            enclave_id,
            PCR,
            PCR,
            PCR,
            TEST_PK,
            utf8(b"veil-dev"),
            ts::ctx(&mut scenario),
        );
        registry::share_for_testing(registry);
        sui::test_utils::destroy(cap);
    };
    ts::next_tx(&mut scenario, TRADER);
    {
        let mut registry = ts::take_shared<Registry>(&scenario);
        let proof_id = execution_proof::record_execution(
            &mut registry,
            TEST_DIGEST,
            TEST_SIG,
            ENCLAVE_ID,
            execution_proof::mode_bull(),
            104847,
            21,
            5,
            BLOB_ID,
            option::none(),
            ts::ctx(&mut scenario),
        );
        assert!(proof_id != object::id_from_address(@0x0));
        ts::return_shared(registry);
    };
    ts::end(scenario);
}

#[test]
fun create_and_settle_parlay() {
    let mut scenario = ts::begin(TRADER);
    ts::next_tx(&mut scenario, TRADER);
    {
        let parlay = parlay::create_parlay(5500, 3560, 800, 2, ts::ctx(&mut scenario));
        assert!(parlay::leg_count(&parlay) == 2);
        transfer::public_transfer(parlay, TRADER);
    };
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = veil::registry::EEnclaveNotFound)]
fun reject_unregistered_enclave() {
    let mut scenario = ts::begin(TRADER);
    ts::next_tx(&mut scenario, TRADER);
    {
        let (registry, cap) = registry::init_for_testing(ts::ctx(&mut scenario));
        registry::share_for_testing(registry);
        sui::test_utils::destroy(cap);
    };
    ts::next_tx(&mut scenario, TRADER);
    {
        let mut registry = ts::take_shared<Registry>(&scenario);
        execution_proof::record_execution(
            &mut registry,
            TEST_DIGEST,
            TEST_SIG,
            b"unknown-enclave!",
            execution_proof::mode_bull(),
            104847,
            21,
            5,
            BLOB_ID,
            option::none(),
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
    };
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = veil::execution_proof::EInvalidMode)]
fun reject_invalid_mode() {
    let mut scenario = ts::begin(ADMIN);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let (mut registry, cap) = registry::init_for_testing(ts::ctx(&mut scenario));
        registry::register_enclave(
            &mut registry,
            &cap,
            ENCLAVE_ID,
            PCR,
            PCR,
            PCR,
            TEST_PK,
            utf8(b"veil-dev"),
            ts::ctx(&mut scenario),
        );
        registry::share_for_testing(registry);
        sui::test_utils::destroy(cap);
    };
    ts::next_tx(&mut scenario, TRADER);
    {
        let mut registry = ts::take_shared<Registry>(&scenario);
        execution_proof::record_execution(
            &mut registry,
            TEST_DIGEST,
            TEST_SIG,
            ENCLAVE_ID,
            99,
            104847,
            21,
            5,
            BLOB_ID,
            option::none(),
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
    };
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = veil::registry::EAttestationReplay)]
fun reject_attestation_replay() {
    let mut scenario = ts::begin(ADMIN);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let (mut registry, cap) = registry::init_for_testing(ts::ctx(&mut scenario));
        registry::register_enclave(
            &mut registry,
            &cap,
            ENCLAVE_ID,
            PCR,
            PCR,
            PCR,
            TEST_PK,
            utf8(b"veil-dev"),
            ts::ctx(&mut scenario),
        );
        registry::share_for_testing(registry);
        sui::test_utils::destroy(cap);
    };
    ts::next_tx(&mut scenario, TRADER);
    {
        let mut registry = ts::take_shared<Registry>(&scenario);
        let _ = execution_proof::record_execution(
            &mut registry,
            TEST_DIGEST,
            TEST_SIG,
            ENCLAVE_ID,
            execution_proof::mode_bull(),
            104847,
            21,
            5,
            BLOB_ID,
            option::none(),
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
    };
    ts::next_tx(&mut scenario, TRADER);
    {
        let mut registry = ts::take_shared<Registry>(&scenario);
        execution_proof::record_execution(
            &mut registry,
            TEST_DIGEST,
            TEST_SIG,
            ENCLAVE_ID,
            execution_proof::mode_bull(),
            104847,
            21,
            5,
            BLOB_ID,
            option::none(),
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
    };
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = veil::attestation::EBadSignature)]
fun reject_invalid_signature() {
    let mut scenario = ts::begin(ADMIN);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let (mut registry, cap) = registry::init_for_testing(ts::ctx(&mut scenario));
        registry::register_enclave(
            &mut registry,
            &cap,
            ENCLAVE_ID,
            PCR,
            PCR,
            PCR,
            TEST_PK,
            utf8(b"veil-dev"),
            ts::ctx(&mut scenario),
        );
        registry::share_for_testing(registry);
        sui::test_utils::destroy(cap);
    };
    ts::next_tx(&mut scenario, TRADER);
    {
        let mut registry = ts::take_shared<Registry>(&scenario);
        let mut bad_sig = TEST_SIG;
        *vector::borrow_mut(&mut bad_sig, 0) = 0xff;
        execution_proof::record_execution(
            &mut registry,
            TEST_DIGEST,
            bad_sig,
            ENCLAVE_ID,
            execution_proof::mode_bull(),
            104847,
            21,
            5,
            BLOB_ID,
            option::none(),
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
    };
    ts::end(scenario);
}
