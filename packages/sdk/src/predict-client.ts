import { PREDICT_TESTNET } from "./config/testnet.js";

import type { OracleSviState } from "./types.js";

import { parseOracleSvi } from "./predict-market.js";



const BASE = PREDICT_TESTNET.serverUrl;



export class PredictServerClient {

  constructor(private readonly baseUrl = BASE) {}



  async getStatus(): Promise<{ ok: boolean }> {

    const res = await fetch(`${this.baseUrl}/status`);

    if (!res.ok) return { ok: false };

    return { ok: true };

  }



  async getPredictState(): Promise<Record<string, unknown>> {

    const id = PREDICT_TESTNET.predictObjectId;

    const res = await fetch(`${this.baseUrl}/predicts/${id}/state`);

    if (!res.ok) throw new Error(`predict state ${res.status}`);

    return (await res.json()) as Record<string, unknown>;

  }



  async getOracles(): Promise<{ oracle_id: string }[]> {

    const id = PREDICT_TESTNET.predictObjectId;

    const res = await fetch(`${this.baseUrl}/predicts/${id}/oracles`);

    if (!res.ok) return [];

    const data = (await res.json()) as { oracle_id: string }[] | { oracles?: { oracle_id: string }[] };

    if (Array.isArray(data)) return data;

    return data.oracles ?? [];

  }



  async getOracleState(oracleId: string): Promise<Record<string, unknown>> {

    const res = await fetch(`${this.baseUrl}/oracles/${oracleId}/state`);

    if (!res.ok) throw new Error(`oracle state ${res.status}`);

    return (await res.json()) as Record<string, unknown>;

  }



  async fetchLiveSvi(): Promise<OracleSviState | null> {
    const oracleId = process.env.PREDICT_ORACLE_ID;
    if (!oracleId) return null;
    const state = await this.getOracleState(oracleId);

    const oracle = state.oracle as { expiry?: number } | undefined;

    if (!oracle?.expiry) return null;

    return parseOracleSvi(state, oracle.expiry);

  }

}

