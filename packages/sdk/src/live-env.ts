/** Production guard — no silent in-memory or simulated fallbacks. */

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required env ${name}. Veil runs live-only — configure .env per README.`,
    );
  }
  return v;
}

export function requireMemWalEnv(): { delegateKey: string; accountId: string } {
  return {
    delegateKey: requireEnv("MEMWAL_DELEGATE_KEY"),
    accountId: requireEnv("MEMWAL_ACCOUNT_ID"),
  };
}

export function requireTxSignerEnv(): { suiKey: string; enokiKey?: string } {
  const suiKey = process.env.SUI_PRIVATE_KEY;
  const enokiKey = process.env.ENOKI_SECRET_KEY;
  if (!suiKey) {
    throw new Error("SUI_PRIVATE_KEY required for on-chain Predict execution.");
  }
  return { suiKey, enokiKey };
}

export function requirePredictOracleId(): string {
  return requireEnv("PREDICT_ORACLE_ID");
}
