/// Execution proofs — on-chain record of TEE-attested executions.
#[allow(lint(self_transfer))]
module veil::execution_proof;

use veil::attestation;
use veil::registry::Registry;
use veil::events;
use veil::parlay;

public struct ExecutionProof has key, store {
    id: UID,
    trader: address,
    mode: u8,
    vwap_achieved: u64,
    market_impact_bps: u64,
    total_fills: u8,
    attestation_hash: vector<u8>,
    enclave_id: vector<u8>,
    timestamp: u64,
    walrus_blob_id: vector<u8>,
    parlay_id: Option<ID>,
}

const MODE_BULL: u8 = 1;
const MODE_BEAR: u8 = 2;
const MODE_EARN: u8 = 3;
const MODE_PARLAY: u8 = 4;

const EEmptyAttestation: u64 = 10;
const EInvalidMode: u64 = 11;
const EInvalidImpact: u64 = 12;
const EInvalidFills: u64 = 13;
const EInvalidVwap: u64 = 14;
const EParlayIdRequired: u64 = 15;
const EBlobIdTooLong: u64 = 16;

const MAX_IMPACT_BPS: u64 = 10_000;
const MAX_FILLS: u8 = 128;
const MAX_BLOB_ID_LEN: u64 = 256;

public fun mode_bull(): u8 { MODE_BULL }
public fun mode_bear(): u8 { MODE_BEAR }
public fun mode_earn(): u8 { MODE_EARN }
public fun mode_parlay(): u8 { MODE_PARLAY }

fun assert_valid_mode(mode: u8) {
    assert!(
        mode == MODE_BULL || mode == MODE_BEAR || mode == MODE_EARN || mode == MODE_PARLAY,
        EInvalidMode,
    );
}

fun assert_execution_bounds(vwap: u64, impact: u64, fills: u8, blob_id: &vector<u8>) {
    assert!(vwap > 0, EInvalidVwap);
    assert!(impact <= MAX_IMPACT_BPS, EInvalidImpact);
    assert!(fills > 0 && fills <= MAX_FILLS, EInvalidFills);
    assert!(blob_id.length() <= MAX_BLOB_ID_LEN, EBlobIdTooLong);
}

fun assert_parlay_mode(mode: u8, parlay_id: &Option<ID>) {
    if (mode == MODE_PARLAY) {
        assert!(parlay_id.is_some(), EParlayIdRequired);
    };
}

/// Verify enclave Ed25519 attestation, then mint ExecutionProof to trader.
public fun record_execution(
    registry: &mut Registry,
    attestation: vector<u8>,
    enclave_signature: vector<u8>,
    enclave_id: vector<u8>,
    mode: u8,
    vwap: u64,
    impact: u64,
    fills: u8,
    blob_id: vector<u8>,
    parlay_id: Option<ID>,
    ctx: &mut TxContext,
): ID {
    assert!(attestation.length() > 0, EEmptyAttestation);
    assert_valid_mode(mode);
    assert_execution_bounds(vwap, impact, fills, &blob_id);
    assert_parlay_mode(mode, &parlay_id);

    let trader = ctx.sender();
    attestation::verify_execution_attestation(
        registry,
        enclave_id,
        attestation,
        enclave_signature,
        trader,
        mode,
        vwap,
        impact,
        fills,
        &blob_id,
    );

    let proof = ExecutionProof {
        id: object::new(ctx),
        trader,
        mode,
        vwap_achieved: vwap,
        market_impact_bps: impact,
        total_fills: fills,
        attestation_hash: attestation,
        enclave_id,
        timestamp: ctx.epoch_timestamp_ms(),
        walrus_blob_id: blob_id,
        parlay_id,
    };
    let proof_id = object::id(&proof);
    events::emit_execution_complete(proof_id, trader, mode, vwap, impact);
    transfer::transfer(proof, trader);
    proof_id
}

/// Create parlay + record PARLAY mode proof in one transaction (user-signed).
public fun record_parlay_execution(
    registry: &mut Registry,
    attestation: vector<u8>,
    enclave_signature: vector<u8>,
    enclave_id: vector<u8>,
    vwap: u64,
    impact: u64,
    fills: u8,
    blob_id: vector<u8>,
    conviction_bps: u64,
    market_prob_bps: u64,
    correlation_bps: u64,
    leg_count: u8,
    ctx: &mut TxContext,
): ID {
    let parlay = parlay::create_parlay(conviction_bps, market_prob_bps, correlation_bps, leg_count, ctx);
    let parlay_id = object::id(&parlay);
    transfer::public_transfer(parlay, ctx.sender());
    record_execution(
        registry,
        attestation,
        enclave_signature,
        enclave_id,
        MODE_PARLAY,
        vwap,
        impact,
        fills,
        blob_id,
        option::some(parlay_id),
        ctx,
    )
}

public fun emit_slice_filled(proof_id: ID, slice_number: u8, fill_price: u64) {
    events::emit_slice_filled(proof_id, slice_number, fill_price);
}

public fun trader(proof: &ExecutionProof): address {
    proof.trader
}

public fun vwap(proof: &ExecutionProof): u64 {
    proof.vwap_achieved
}

public fun attestation_hash(proof: &ExecutionProof): &vector<u8> {
    &proof.attestation_hash
}

public fun walrus_blob_id(proof: &ExecutionProof): &vector<u8> {
    &proof.walrus_blob_id
}

public fun execution_digest(
    trader: address,
    mode: u8,
    vwap: u64,
    impact_bps: u64,
    fills: u8,
    blob_id: &vector<u8>,
    enclave_id: &vector<u8>,
): vector<u8> {
    attestation::execution_digest(trader, mode, vwap, impact_bps, fills, blob_id, enclave_id)
}

/// Legacy entry wrapper (required for compatible upgrade).
public entry fun record_execution_entry(
    registry: &mut Registry,
    attestation: vector<u8>,
    enclave_signature: vector<u8>,
    enclave_id: vector<u8>,
    mode: u8,
    vwap: u64,
    impact: u64,
    fills: u8,
    blob_id: vector<u8>,
    parlay_id: Option<ID>,
    ctx: &mut TxContext,
) {
    let _proof_id = record_execution(
        registry,
        attestation,
        enclave_signature,
        enclave_id,
        mode,
        vwap,
        impact,
        fills,
        blob_id,
        parlay_id,
        ctx,
    );
}
