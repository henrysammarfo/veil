export type VeilMode = "BULL" | "BEAR" | "EARN" | "PARLAY";

export interface VeilOrder {
  direction: "LONG" | "SHORT";
  asset: string;
  sizeUsdc: number;
  timeHorizonHours: number;
  userConvictionPct: number;
  maxSlippageBps: number;
  mode: VeilMode;
  strike?: number;
  intent?: string;
  /** Sui address of trader — required for on-chain Ed25519 attestation binding */
  traderAddress?: string;
}

export interface ExecutionResult {
  executionId: string;
  mode: VeilMode;
  vwap: number;
  marketImpactBps: number;
  totalFills: number;
  attestationPayload: string;
  attestationHash: string;
  onChainAttestation?: {
    digest: string;
    signature: string;
    publicKey: string;
  };
  proofObjectId?: string;
  txDigests: string[];
  walrusBlobId?: string;
}

export interface ExecutionProof {
  objectId: string;
  trader: string;
  mode: number;
  vwapAchieved: number;
  marketImpactBps: number;
  totalFills: number;
  attestationHash: string;
  walrusBlobId: string;
  timestamp: number;
}

export interface OracleSviState {
  a: number;
  b: number;
  rho: number;
  m: number;
  sigma: number;
  t: number;
  updatedAtMs: number;
}

export interface PredictStateResponse {
  forward?: number;
  utilization?: number;
}
