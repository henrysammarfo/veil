import type { ExecutionResult, VeilOrder } from "./types.js";

export interface VeilApiConfig {
  baseUrl: string;
  enclaveUrl?: string;
}

export class VeilClient {
  constructor(private readonly config: VeilApiConfig) {}

  async submitOrder(order: VeilOrder): Promise<ExecutionResult> {
    const res = await fetch(`${this.config.baseUrl}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`execute failed: ${res.status} ${text}`);
    }
    return (await res.json()) as ExecutionResult;
  }

  async getProofs(trader: string): Promise<ExecutionResult[]> {
    const res = await fetch(
      `${this.config.baseUrl}/api/proofs?trader=${encodeURIComponent(trader)}`,
    );
    if (!res.ok) return [];
    return (await res.json()) as ExecutionResult[];
  }

  async verifyAttestation(attestationHash: string): Promise<boolean> {
    const res = await fetch(`${this.config.baseUrl}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attestationHash }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { valid: boolean };
    return data.valid;
  }

  async health(): Promise<boolean> {
    const res = await fetch(`${this.config.baseUrl}/health`);
    return res.ok;
  }
}

export function createVeilClient(baseUrl: string): VeilClient {
  return new VeilClient({ baseUrl });
}
