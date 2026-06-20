import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import type { Transaction } from "@mysten/sui/transactions";
import { requireTxSignerEnv } from "./live-env.js";
import { PREDICT_TESTNET } from "./config/testnet.js";

export interface PredictExecutorConfig {
  privateKey?: string;
  enokiApiKey?: string;
  network?: "testnet" | "mainnet";
  rpcUrl?: string;
}

export class PredictExecutor {
  private readonly client: SuiJsonRpcClient;
  private readonly keypair: Ed25519Keypair;
  private readonly enokiApiKey: string | null;
  private readonly network: "testnet" | "mainnet";

  constructor(config: PredictExecutorConfig = {}) {
    this.network = config.network ?? "testnet";
    this.client = new SuiJsonRpcClient({
      url: config.rpcUrl ?? getJsonRpcFullnodeUrl(this.network),
      network: this.network,
    });
    if (!config.privateKey) {
      throw new Error("PredictExecutor: SUI_PRIVATE_KEY required");
    }
    this.keypair = Ed25519Keypair.fromSecretKey(config.privateKey);
    this.enokiApiKey = config.enokiApiKey ?? null;
  }

  get isLive(): boolean {
    return true;
  }

  get canSponsor(): boolean {
    return this.enokiApiKey !== null;
  }

  get address(): string {
    return this.keypair.getPublicKey().toSuiAddress();
  }

  /** Execute PTB on testnet — waits for checkpoint before returning digest. */
  async execute(tx: Transaction, timeoutMs = 55_000): Promise<string> {
    tx.setSenderIfNotSet(this.keypair.getPublicKey().toSuiAddress());
    const work = this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
      options: { showEffects: true },
    });
    const result = await Promise.race([
      work,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`tx timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
    const digest = extractTxDigest(result);
    if (!digest) throw new Error("execute returned no digest");
    // Let checkpoint finalize so shared objects (PredictManager) have fresh versions for TWAP.
    const settleMs = Number(process.env.TX_SETTLE_MS ?? "3000");
    if (settleMs > 0) await new Promise((r) => setTimeout(r, settleMs));
    return digest;
  }

  async dryRun(tx: Transaction): Promise<{ success: boolean; error?: string }> {
    try {
      tx.setSenderIfNotSet(this.keypair.getPublicKey().toSuiAddress());
      await this.client.core.simulateTransaction({ transaction: tx });
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}

/** Sui 2.x jsonRpc vs core client return different shapes for the same tx. */
function extractTxDigest(result: unknown): string | undefined {
  const r = result as Record<string, unknown>;
  if (typeof r.digest === "string") return r.digest;
  for (const key of ["Transaction", "FailedTransaction"] as const) {
    const nested = r[key] as { digest?: string } | undefined;
    if (typeof nested?.digest === "string") return nested.digest;
  }
  const legacy = (r.transaction as { digest?: string } | undefined)?.digest;
  return typeof legacy === "string" ? legacy : undefined;
}

export function createPredictExecutorFromEnv(): PredictExecutor {
  const { suiKey, enokiKey } = requireTxSignerEnv();
  return new PredictExecutor({
    privateKey: suiKey,
    enokiApiKey: enokiKey,
    network: (process.env.VITE_SUI_NETWORK as "testnet") ?? "testnet",
    rpcUrl: process.env.SUI_RPC_URL,
  });
}

export { PREDICT_TESTNET };
