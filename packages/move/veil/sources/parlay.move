/// Parlay linker — combines multiple prediction legs into one structured product.
#[allow(lint(self_transfer))]
module veil::parlay;

use sui::event;
use veil::events;

public struct Parlay has key, store {
    id: UID,
    owner: address,
    leg_count: u8,
    conviction_bps: u64,
    market_prob_bps: u64,
    correlation_bps: u64,
    settled: bool,
    won: bool,
}

public struct ParlayCreated has copy, drop {
    parlay_id: ID,
    owner: address,
    leg_count: u8,
}

const ENotOwner: u64 = 20;
const EAlreadySettled: u64 = 21;
const EInvalidLegCount: u64 = 22;
const EInvalidBps: u64 = 23;

const MAX_BPS: u64 = 10_000;

fun assert_valid_bps(conviction_bps: u64, market_prob_bps: u64, correlation_bps: u64) {
    assert!(conviction_bps <= MAX_BPS, EInvalidBps);
    assert!(market_prob_bps <= MAX_BPS, EInvalidBps);
    assert!(correlation_bps <= MAX_BPS, EInvalidBps);
}

/// Create parlay container; legs linked via execution proofs at record_execution time.
public fun create_parlay(
    conviction_bps: u64,
    market_prob_bps: u64,
    correlation_bps: u64,
    leg_count: u8,
    ctx: &mut TxContext,
): Parlay {
    assert!(leg_count >= 2 && leg_count <= 8, EInvalidLegCount);
    assert_valid_bps(conviction_bps, market_prob_bps, correlation_bps);
    let owner = ctx.sender();
    let parlay = Parlay {
        id: object::new(ctx),
        owner,
        leg_count,
        conviction_bps,
        market_prob_bps,
        correlation_bps,
        settled: false,
        won: false,
    };
    event::emit(ParlayCreated {
        parlay_id: object::id(&parlay),
        owner,
        leg_count,
    });
    parlay
}

public fun settle_parlay(parlay: &mut Parlay, won: bool, ctx: &mut TxContext) {
    assert!(parlay.owner == ctx.sender(), ENotOwner);
    assert!(!parlay.settled, EAlreadySettled);
    parlay.settled = true;
    parlay.won = won;
    events::emit_parlay_settled(object::id(parlay), won);
}

public fun owner(parlay: &Parlay): address {
    parlay.owner
}

public fun leg_count(parlay: &Parlay): u8 {
    parlay.leg_count
}

public fun id(parlay: &Parlay): ID {
    object::id(parlay)
}

/// Legacy entry wrapper (required for compatible upgrade).
public entry fun create_parlay_entry(
    conviction_bps: u64,
    market_prob_bps: u64,
    correlation_bps: u64,
    leg_count: u8,
    ctx: &mut TxContext,
) {
    let parlay = create_parlay(conviction_bps, market_prob_bps, correlation_bps, leg_count, ctx);
    transfer::public_transfer(parlay, ctx.sender());
}
