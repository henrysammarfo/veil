/// Veil on-chain event catalog — shared event types for indexers and institution reports.
module veil::events;

use sui::event;
public struct ExecutionComplete has copy, drop {
    proof_id: ID,
    trader: address,
    mode: u8,
    vwap: u64,
    impact_bps: u64,
}

public struct SliceFilled has copy, drop {
    proof_id: ID,
    slice_number: u8,
    fill_price: u64,
}

public struct ParlaySettled has copy, drop {
    parlay_id: ID,
    won: bool,
}

public fun emit_execution_complete(
    proof_id: ID,
    trader: address,
    mode: u8,
    vwap: u64,
    impact_bps: u64,
) {
    event::emit(ExecutionComplete {
        proof_id,
        trader,
        mode,
        vwap,
        impact_bps,
    });
}

public fun emit_slice_filled(proof_id: ID, slice_number: u8, fill_price: u64) {
    event::emit(SliceFilled { proof_id, slice_number, fill_price });
}

public fun emit_parlay_settled(parlay_id: ID, won: bool) {
    event::emit(ParlaySettled { parlay_id, won });
}
